export class CloudlfareClient {
  constructor(private zoneId: string, private token: string) {}

  formatRecord(params: object) {
    return { proxied: false, ttl: 1, ...params };
  }

  async fetchJson(url: RequestInfo, init?: RequestInit): Promise<any> {
    const req = new Request(url, init);
    req.headers.append("authorization", `Bearer ${this.token}`);
    req.headers.append("content-type", "application/json");
    const res = await fetch(req);
    if (!res.ok) {
      const { url, headers, method } = req;
      throw { req: { url, headers, method }, res };
    }
    return res.json();
  }

  get baseUrl(): string {
    return `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`;
  }

  async findId(name: string, type: string = "A"): Promise<string> {
    return (
      await this.fetchJson(
        `${this.baseUrl}?${new URLSearchParams({ name, type })}`
      )
    ).result[0]?.id;
  }

  async list(): Promise<any> {
    return this.fetchJson(this.baseUrl);
  }

  async createOrUpdateRecord(
    name: string,
    type: string,
    content: string,
    ttl: number = 1
  ): Promise<string> {
    const record = this.formatRecord({ type, name, content, ttl });
    let res;
    try {
      const oldId = await this.findId(name);
      res = await this.fetchJson(`${this.baseUrl}/${oldId}`, {
        method: "PUT",
        body: JSON.stringify(record),
      });
    } catch {
      res = await this.fetchJson(this.baseUrl, {
        method: "POST",
        body: JSON.stringify(record),
      });
    }
    return res.result.id;
  }

  async deleteId(id: string) {
    return this.fetchJson(`${this.baseUrl}/${id}`, { method: "DELETE" });
  }

  async deleteRecord(name: string, type?: string) {
    const id = await this.findId(name, type);
    return this.fetchJson(`${this.baseUrl}/${id}`, { method: "DELETE" });
  }
}
