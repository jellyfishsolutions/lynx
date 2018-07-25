import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany
} from "typeorm";
import BaseEntity from "./base.entity";
import User from "./user.entity";
import * as sharp from "sharp";
import * as uuid from "uuid/v4";
import { app } from "../app";

export interface ResizeConfig {
    rotate: number;
    scaleX: number;
    scaleY: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

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
            return super.remove();
        }
        let k = await super.remove();
        app.config.ufs.unlink(this.path, () => {});
        return k;
    }

    /**
     * Create a cropped image starting of the current.
     * The image will be placed in the same directory as the original.
     * @param config: The configuration object containing the crop parameters
     * @return a promise with the new @type Media
     */
    async resizeToNewEntity(config: ResizeConfig): Promise<Media> {
        let img = sharp(this.path);
        let data = await img.metadata();
        img = img
            .rotate(config.rotate)
            .resize(
                (data.width as number) * Math.round(config.scaleX),
                (data.height as number) * Math.round(config.scaleY)
            )
            .extract({
                left: Math.round(config.x),
                top: Math.round(config.y),
                width: Math.round(config.width),
                height: Math.round(config.height)
            });
        let newFileName = uuid();
        let path = app.config.uploadPath;
        await img.toFile(path + "/" + newFileName);
        let newMedia = new Media();
        newMedia.isDirectory = false;
        newMedia.originalName = copiedName(this.originalName);
        newMedia.mimetype = this.mimetype;
        let stat = await app.config.ufs.stat(path + "/" + newFileName);
        newMedia.size = stat.size;
        newMedia.fileName = newFileName;
        newMedia.path = path + "/" + newFileName;
        newMedia.owner = this.owner;
        newMedia.parent = this.parent;
        return await newMedia.save();
    }

    static async persist(
        uploadMedia: Express.Multer.File,
        user: User,
        directory?: Media
    ): Promise<Media> {
        let m = new Media();
        uploadMedia = await app.config.ufs.uploadFile(uploadMedia);
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

    static findOneWithParent(id: number): Promise<Media | undefined> {
        return Media.findOne({ where: { id: id }, relations: ["parent"] });
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

function copiedName(name: string): string {
    let index = name.lastIndexOf(".");
    if (index == -1) {
        return name + " 1";
    }
    return name.substring(0, index) + " 1" + name.substring(index);
}
