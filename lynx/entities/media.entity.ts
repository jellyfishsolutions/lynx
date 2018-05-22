import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany
} from "typeorm";
import BaseEntity from "./base.entity";
import User from "./user.entity";
import * as fs from "fs";

@Entity("media")
export default class Media extends BaseEntity {
    hiddenFields = ["owner", "_children", "children", "parent"];

    @PrimaryGeneratedColumn() id: number;
    @Column() originalName: string;
    @Column({ unique: true, default: null })
    slug: string;
    @Column({ type: "tinyint", default: false })
    private is_directory: number;

    get isDirectory(): boolean {
        return this.is_directory == 1;
    }

    set isDirectory(value: boolean) {
        if (value) {
            this.is_directory = 1;
        } else {
            this.is_directory = 0;
        }
    }

    @Column() mimetype: string;
    @Column() size: number;
    @Column() fileName: string;
    @Column() path: string;

    @ManyToOne(_ => Media, media => media._children)
    parent: Media;

    @OneToMany(_ => Media, media => media.parent)
    _children: Media[];

    @ManyToOne(_ => User, user => user.media, { eager: true })
    owner: User;

    get children(): Promise<Media[]> {
        return Media.find({ where: { parent: this } });
    }

    async remove(): Promise<this> {
        if (this.isDirectory) {
            for (let child of await this.children) {
                await child.remove();
            }
        } else {
            fs.unlink(this.path, () => {});
        }
        return super.remove();
    }

    static async persist(
        uploadMedia: Express.Multer.File,
        user: User,
        directory?: Media
    ): Promise<Media> {
        let m = new Media();
        m.originalName = uploadMedia.originalname;
        m.isDirectory = false;
        m.mimetype = uploadMedia.mimetype;
        m.size = uploadMedia.size;
        m.fileName = uploadMedia.filename;
        m.path = uploadMedia.path;
        m.owner = user;
        if (directory) {
            m.parent = directory;
        }
        await m.save();
        return m;
    }

    static async mkdir(
        name: string,
        user?: User,
        directory?: Media | null
    ): Promise<Media> {
        let names = normalizePath(name).split("/");
        let prev = directory;
        for (let i = 0; i < names.length; i++) {
            let n = names[i];
            if (!prev) {
                prev = null;
            }
            let where = {
                where: {
                    originalName: n,
                    is_directory: 1,
                    parent: prev
                }
            };
            let m = await Media.findOne(where);
            if (!m) {
                m = new Media();
                m.originalName = n;
                m.isDirectory = true;
                if (user) {
                    m.owner = user;
                }
                if (prev) {
                    m.parent = prev;
                }
                await m.save();
            }
            prev = m;
        }
        return <Media>prev;
    }

    static async getFolder(path: string): Promise<Media | undefined> {
        let names = normalizePath(path).split("/");
        let prev = null;
        for (let n of names) {
            prev = await Media.findOne({
                where: {
                    originalName: n,
                    is_directory: 1,
                    parent: prev
                }
            });
            if (!prev) {
                return prev;
            }
        }
        return <Media>prev;
    }

    static findBySlug(slug: string): Promise<Media | undefined> {
        return Media.findOne({ where: { slug: slug, is_directory: 0 } });
    }

    static findBySlugOrId(key: string): Promise<Media | undefined> {
        return Media.getRepository()
            .createQueryBuilder("m")
            .where("m.slug = :slug AND is_directory = 0", { slug: key })
            .orWhere("m.id = :id AND is_directory = 0", { id: key })
            .getOne();
    }
}

function normalizePath(path: string): string {
    if (path.startsWith("/")) {
        path = path.substring(1);
    }
    if (path.endsWith("/")) {
        path = path.substring(0, path.length - 1);
    }
    return path;
}
