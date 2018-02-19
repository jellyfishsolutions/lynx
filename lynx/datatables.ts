import { Repository, SelectQueryBuilder } from "typeorm";
import { Request } from "express";

export class Element {
    _class: string;
    text: string;
}

export class TableConfiguration {
    _class: string = "";
    header: Element[] = [];
    data: Element[][] = [];

    addClass(_class: string): TableConfiguration {
        this._class += _class + " ";
        return this;
    }

    addHeader(text: string, _class?: string): TableConfiguration {
        this.header.push({ text: text, _class: _class ? _class : "" });
        return this;
    }

    addData(texts: string[], _classes?: string[]): TableConfiguration {
        let c: Element[] = [];
        for (let i = 0; i < texts.length; i++) {
            c.push({
                text: texts[i],
                _class: _classes && _classes[i] ? _classes[i] : ""
            });
        }
        this.data.push(c);
        return this;
    }
}

export class PaginationConfiguration {
    total = 0;
    pageSize = 10;
    pageCount = 0;
    currentPage = 0;
    left = 0;
    right = 0;
    maxPages = 2;
    _class: string = "";

    calculate() {
        this.pageCount = this.total / this.pageSize;

        this.left = Math.max(0, this.currentPage - this.maxPages);
        this.right = Math.min(
            this.pageCount,
            this.currentPage + 1 + this.maxPages
        );
    }

    addClass(_class: string): PaginationConfiguration {
        this._class += _class + " ";
        return this;
    }
}

export class DatatableConfiguration {
    private table: TableConfiguration = new TableConfiguration();
    private repository: Repository<any>;
    private req: Request;
    private urlNoPage: string;
    private urlNoOrder: string;
    private map: string[];
    private _classes: string[] = [];
    private mapTransformers: any = {};
    private pagination: PaginationConfiguration = new PaginationConfiguration();

    constructor(repository: Repository<any>, req: Request) {
        this.repository = repository;
        this.req = req;
        this.setupPageRequested();
        this.urlNoPage = getUrlWithoutPage(this.req);
        this.urlNoOrder = getUrlWithoutOrder(this.req);
    }

    public setPageSize(size: number) {
        this.pagination.pageSize = size;
    }

    public addTableClass(_class: string): DatatableConfiguration {
        this.table.addClass(_class);
        return this;
    }

    public addTableHeader(
        text: string,
        _class?: string
    ): DatatableConfiguration {
        this.table.addHeader(text, _class);
        return this;
    }

    public addDataMap(
        map: string[],
        _classes?: string[]
    ): DatatableConfiguration {
        this.map = map;
        if (_classes) {
            this._classes = _classes;
        } else {
            this._classes = [];
            for (let i = 0; i < this.map.length; i++) {
                this._classes.push("");
            }
        }
        return this;
    }

    public addDataTransformer(
        label: string,
        exe: (value: any, entity: any) => any
    ): DatatableConfiguration {
        this.mapTransformers[label] = exe;
        return this;
    }

    public addPaginationClass(_class: string): DatatableConfiguration {
        this.pagination.addClass(_class);
        return this;
    }

    private setupPageRequested() {
        this.pagination.currentPage = 0;
        if (this.req.query.page) {
            this.pagination.currentPage = Number(this.req.query.page);
            if (this.pagination.currentPage > 0) {
                this.pagination.currentPage -= 1;
            }
        }
    }

    private getQueryValue(key: string): any[] {
        for (let q in this.req.query) {
            if (q.toLowerCase() !== key) {
                continue;
            }
            if (this.req.query[q] instanceof Array) {
                return this.req.query[q];
            }
            return [this.req.query[q]];
        }
        return [];
    }

    private addOrderBy(
        query: SelectQueryBuilder<any>
    ): SelectQueryBuilder<any> {
        let ordersBy = this.getQueryValue("orderby");
        if (ordersBy.length) {
            let order = ordersBy[0].split(":");
            query = query.orderBy(
                "e." + order[0],
                order[1] == "desc" ? "DESC" : "ASC"
            );
            for (let i = 1; i < ordersBy.length; i++) {
                let order = ordersBy[i].split(":");
                query = query.addOrderBy(
                    "e." + order[0],
                    order[1] == "desc" ? "DESC" : "ASC"
                );
            }
        }
        return query;
    }

    private addFilterBy(
        query: SelectQueryBuilder<any>
    ): SelectQueryBuilder<any> {
        let filtersBy = this.getQueryValue("filterby");
        if (filtersBy.length) {
            let f = filtersBy[0].split(":");
            let o: any = {};
            o[f[0] + "_" + 0] = f[1];
            query = query.where("e." + f[0] + " = :" + f[0] + "_" + 0, o);
            for (let i = 1; i < filtersBy.length; i++) {
                let f = filtersBy[i].split(":");
                let o: any = {};
                o[f[0] + "_" + i] = f[1];
                query = query.andWhere(
                    "e." + f[0] + " = :" + f[0] + "_" + i,
                    o
                );
            }
        }
        return query;
    }

    public async fetchData(query?: SelectQueryBuilder<any>): Promise<void> {
        if (!query) {
            let select: string[] = [];
            this.map.forEach(v => {
                if (!v.startsWith(":")) {
                    select.push("e." + v.replace("-", ""));
                }
            });
            query = this.repository.createQueryBuilder("e").select(select);
        }

        query = this.addFilterBy(query);

        this.pagination.total = await query.getCount();
        this.pagination.calculate();

        query = this.addOrderBy(query);

        let skip = this.pagination.currentPage * this.pagination.pageSize;
        query = query.skip(skip).take(this.pagination.pageSize);

        let result = await query.getMany();

        for (let r of result) {
            let line: string[] = [];
            for (let label of this.map) {
                if (label.startsWith("-")) continue;
                let cell = r[label];
                if (this.mapTransformers[label]) {
                    cell = this.mapTransformers[label](cell, r);
                }
                line.push(cell);
            }
            this.table.addData(line, this._classes);
        }
    }
}

function getUrlWithoutPage(req: Request): string {
    return getUrlWithoutParameter(req, "page");
}

function getUrlWithoutOrder(req: Request): string {
    return getUrlWithoutParameter(req, "orderby");
}

function getUrlWithoutParameter(req: Request, parameter: string): string {
    let u = (req.baseUrl + req.path).replace(/\/$/, "") + "?";
    for (let key in req.query) {
        if (key.toLowerCase() == parameter) continue;
        u += generateQueryValue(key, req.query[key]);
    }
    return u;
}

function generateQueryValue(key: string, q: any): string {
    let m = key + "=";
    if (q instanceof Array) {
        m += q[0] + "&";
        for (let i = 1; i < q.length; i++) {
            m += key + "=" + q[i] + "&";
        }
        return m;
    }
    return m + q + "&";
}
