import Role from "./role.entity";
import User from "./user.entity";
import * as userLib from "../libs/users";
import * as fs from "fs";

export async function setup(entitiesPaths: string[]) {
    let admin = await Role.getRepository().findOne({
        where: { name: Role.ADMIN }
    });
    if (!admin) {
        admin = await createAdmin();
    }

    let staff = await Role.getRepository().findOne({
        where: { name: Role.STAFF }
    });

    if (!staff) {
        createStaff();
    }

    let administrator = await User.getRepository().findOne({
        where: { email: "admin@gmail.com" }
    });
    if (!administrator) {
        administrator = new User();
        administrator.email = "admin@gmail.com";
        administrator.password = await userLib.hashPassword("password");
        administrator.firstName = "Admin";
        administrator.lastName = "Admin";
        administrator.roles = [admin];
        await administrator.save();
    }

    for (let path of entitiesPaths) {
        if (path.endsWith("/*.entity.js")) {
            path = path.substring(0, path.length - "/*.entity.js".length);
        }
        if (!fs.existsSync(path)) {
            continue;
        }
        const files = fs.readdirSync(path);
        for (let index in files) {
            if (files[index].endsWith("ts")) continue;
            const entity = require(path + "/" + files[index]);
            if (entity.migrate) {
                console.log("Running 'migrate' method for " + files[index]);
                entity.migrate();
            }
        }
    }
}

async function createAdmin(): Promise<Role> {
    let admin = new Role();
    admin.name = Role.ADMIN;
    admin.level = Role.ADMIN_LEVEL;
    admin.readableName = "Administrator";
    admin.description = "The Administator role";
    return admin.save();
}

async function createStaff() {
    let staff = new Role();
    staff.name = Role.STAFF;
    staff.level = Role.STAFF_LEVEL;
    staff.readableName = "Staff";
    staff.description = "Tge Staff role";
    await staff.save();
}
