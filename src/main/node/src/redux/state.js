import { walk, flattenTree, uidGenerator } from '../selectors/tree';
import { buildHierarchy } from '../components/Flamegraph';
export const setUid = uidGenerator('uid');
export const getUid = (v) => v.uid;

export default class State {
    constructor(data, getChildren=v=>v.children) {
        this.data=data
        this.getChildren=getChildren
        this.byId = {}
        this.flat = {}
        this.flame = {}
        data.forEach(entry => {
            walk(entry, setUid)
            walk(entry, (v) => {
                v._count = v.count;
                v._avg = v.mean/1000000;
            },
                getChildren)
        })
        data.forEach(entry => {
            if (typeof this.byId[getUid(entry)] !== "undefined") {
                console.log("UID already used ", { uid: getUid(entry), entry, previous: this.byId[getUid(entry)] })
            }
            this.byId[getUid(entry)] = entry;
            walk(entry, (v) => {
                v._self = v._avg - (v.children ? v.children.map(c => c._avg).reduce((a, b) => a + b, 0) : 0)
            },
                getChildren)
        })

    }
    getData(id){
        if(typeof id === "undefined"){
            return this.data
        }else{
            return this.byId[id]
        }
        
    }
    getHierarchy(id) {
        if (this.flame[id]) {
            return this.flame[id]
        } else {
            const entry = this.byId[id]
            const rtrn = buildHierarchy(
                { ...entry },
                (v) => {
                    if (v._avg) {
                        return v._avg;
                    } else {
                        return 1
                    }
                },
                (v) => v.children, 0.00001)
            this.flame[id]=rtrn;
            return rtrn;
        }
    }
    getFlatTree(id){
        if(this.flat[id]){
            return this.flat[id];
        }else{
            const entry = this.byId[id]
            const rtrn = flattenTree(
                entry,
                this.getChildren,
                getUid,
                v => { delete v.children }
            );
            this.flat[id]=rtrn;
            return rtrn;
        }
    }

}


