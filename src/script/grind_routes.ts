

class GrindRoute extends BaseRoute {
    statName!: anyStatName;
    totalStatGain!: number;
    totalTime!: number;
    projectedGain!: number;
    zone!: number;
    realm!: number;
    route!: any[];
    requirements!: simpleStuffList;
    cloneHealth!: number[];
    clonesLost!: number;
    x: number;
    y: number;

    constructor(x: anyStatName, totalStatGain:number)
    constructor(x: PropertiesOf<GrindRoute>)
    constructor(x: anyStatName | PropertiesOf<GrindRoute>, totalStatGain:number = 0) {
        super();
        if (typeof x !== 'string') {
            Object.assign(this, x);
            return;
        }
        this.statName = x;
        this.totalStatGain = totalStatGain;
        this.totalTime = queueTime;
        this.projectedGain = GrindRoute.calculateProjectedGain(this.statName, this.totalStatGain);

        this.zone = currentZone;
        this.realm = currentRealm;
        let route = queues.map((r, i) => (clones[i].x == this.x && clones[i].y == this.y ? queueToStringStripped(r) : queueToString(r)));
        route = route.filter(e => e.length);

        if (route.every((e, i, a) => e == a[0])) {
            route = [route[0]];
        } else {
            let unique = route.find((e, i, a) => a.filter(el => el == e).length == 1);
            let ununique = route.find(e => e != unique);
            if (route.every(e => e == unique || e == ununique)) {
                route = [unique, ununique];
            }
        }
        this.route = route;
        // cloneHealth is [min (from start), delta]
        this.cloneHealth = clones.map(c => c.minHealth);

        this.clonesLost = clones.filter(c => c.x != this.x || c.y != this.y).length;

        this.requirements = zones[currentZone].startStuff
            .map(s => {
                return {
                    name: s.name,
                    count: s.count - getStuff(s.name).min
                };
            })
            .filter(s => s.count > 0);
    }

    static calculateProjectedGain(pStatName:anyStatName, pTotalStatGain:number) {
        let scalingStart = 99 + getRealmMult('Compounding Realm');
        let stat = getStat(pStatName);
        let val = (stat.base + pTotalStatGain + 1) ** (0.9 * (stat.base > scalingStart ? scalingStart / stat.base : 1) ** 0.05) - (stat.base + 1);
        let prevVal = (stat.base + 1) ** (0.9 * (stat.base > scalingStart ? scalingStart / stat.base : 1) ** 0.05) - (stat.base + 1);
        return val < 0 ? 0 : (val - (prevVal < 0 ? 0 : prevVal)) / stat.statIncreaseDivisor;
    }

    static getBestRoute(stat:anyStatName) {
        return grindRoutes.find(r => r.statName == stat);
    }

    static updateBestRoute(stat: anyStatName, totalStatGain: number) {
        if (stat == 'Mana' || !totalStatGain) return;
        let prev = GrindRoute.getBestRoute(stat);
        if (!prev || totalStatGain > prev.totalStatGain) {
            grindRoutes = grindRoutes.filter(e => e.statName != stat);
            grindRoutes.push(new GrindRoute(stat, totalStatGain || 0));
        } else {
            prev.projectedGain = GrindRoute.calculateProjectedGain(prev.statName, prev.totalStatGain);
        }
    }

    static migrate(ar:PropertiesOf<GrindRoute>[]) {
        return ar;
    }

    static fromJSON(ar:PropertiesOf<GrindRoute>[]) {
        ar = this.migrate(ar);
        return ar.map(r => new GrindRoute(r));
    }
}

let grindRoutes: GrindRoute[] = [];
