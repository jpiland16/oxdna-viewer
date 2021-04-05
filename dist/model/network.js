/**
 * Two simple classes meant for easy generation, viewing, and deletion of networks
 */
class Edges {
    constructor() {
        this.total = 0;
        this.p1 = [];
        this.p2 = [];
        this.ks = [];
        this.eqDist = [];
        this.types = [];
        this.extraParams = [];
    }
    addEdge(id1, id2, eqdist, type, k = 1, xparams = []) {
        if (id1 < id2) {
            this.p1.push(id1);
            this.p2.push(id2);
            this.ks.push(k);
            this.types.push(type);
            this.eqDist.push(eqdist);
            this.extraParams.push(xparams);
            this.total += 1;
        }
        else if (id2 > id1) {
            this.p1.push(id2);
            this.p2.push(id1);
            this.ks.push(k);
            this.eqDist.push(eqdist);
            this.extraParams.push(xparams);
            this.types.push(type);
            this.total += 1;
        }
    }
    ;
    removeEdge(id1, id2) {
        if (id1 == id2)
            return;
        for (let i = 0; i < this.total; i++) {
            if ((this.p1[i] == id1 && this.p2[i] == id2) || (this.p1[i] == id2 && this.p2[i] == id1)) {
                this.p1.splice(i, 1);
                this.p2.splice(i, 1);
                this.ks.splice(i, 1);
                this.types.splice(i, 1);
                this.eqDist.splice(i, 1);
                this.extraParams.splice(i, 1);
                this.total -= 1;
                break;
            }
        }
    }
    ;
    clearAll() {
        this.p1 = [];
        this.p2 = [];
        this.ks = [];
        this.eqDist = [];
        this.types = [];
        this.extraParams = [];
        this.total = 0;
    }
    ;
}
class Network {
    // id is used by the visualizer as it is a system object (sorta)
    // nid is the network identifier only
    constructor(nid, selectedMonomers) {
        this.particles = selectedMonomers;
        this.types = this.particles.map(s => { return s.type; });
        this.masses = [];
        this.fillMasses(this.particles);
        this.nid = nid; // Separate Indexing for network objects
        this.reducedEdges = new Edges(); // Holds all info about connections
        this.simFC = 0.05709; // gamma_sim
        this.kb = 0.00138064852; //Boltzmann Constant in pN/A
        this.networktype = 'empty';
        this.onscreen = false;
        this.elemcoords = {
            // coords: this.particles.map(e => e.getPos()),
            xI: selectedMonomers.map(e => e.getPos().x),
            yI: selectedMonomers.map(e => e.getPos().y),
            zI: selectedMonomers.map(e => e.getPos().z),
            distance: function (i, j) {
                // return this.coords[i].distanceTo(this.coords[j]);
                return Math.sqrt((this.xI[i] - this.xI[j]) ** 2 + (this.yI[i] - this.yI[j]) ** 2 + (this.zI[i] - this.zI[j]) ** 2);
            },
            rotation: function (i, j) {
                return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), //this.coords[i].clone().sub(this.coords[j]).normalize()
                new THREE.Vector3(this.xI[i] - this.xI[j], this.yI[i] - this.yI[j], this.zI[i] - this.zI[j]).normalize());
            },
            center: function (i, j) {
                // return this.coords[i].clone().add(this.coords[j]).divideScalar(2);
                return new THREE.Vector3((this.xI[i] + this.xI[j]) / 2, (this.yI[i] + this.yI[j]) / 2, (this.zI[i] + this.zI[j]) / 2);
            },
            diff: function (i, j) {
                return new THREE.Vector3((this.xI[j] - this.xI[i]), (this.yI[j] - this.yI[i]), (this.zI[j] - this.zI[i]));
            }
        };
        flux.prepJSONButton(nid);
    }
    ;
    //The below functions are for merging the ANM and Network
    initInstances(nInstances) {
        this.INSTANCES = nInstances;
        this.offsets = new Float32Array(this.INSTANCES * 3);
        this.rotations = new Float32Array(this.INSTANCES * 4);
        this.colors = new Float32Array(this.INSTANCES * 3);
        this.scales = new Float32Array(this.INSTANCES * 3);
        this.visibility = new Float32Array(this.INSTANCES * 3);
    }
    ;
    toJson() {
        let coords = this.elemcoords.xI.map((x, xid) => [x * 8.518, this.elemcoords.yI[xid] * 8.518, this.elemcoords.zI[xid] * 8.518]);
        // let connections = this.reducedEdges.p1.map((x, xid) => [x, this.reducedEdges.p2[xid], this.reducedEdges.ks[xid],]);
        let simMasses = this.masses.slice();
        return { "simMasses": simMasses, "coordinates": coords };
    }
    ;
    selectNetwork() {
        api.selectElements(this.particles, false);
    }
    ;
    sendtoUI() {
        this.fittingReady = true;
    }
    ;
    fillVec(vecName, unitSize, pos, vals) {
        for (let i = 0; i < unitSize; i++) {
            this[vecName][pos * unitSize + i] = vals[i];
        }
    }
    ;
    fillMasses(mon) {
        this.masses = [];
        mon.forEach(t => {
            if (t.type == 'gs') {
                let g = t;
                this.masses.push(g.mass);
            }
            else {
                this.masses.push(1);
            }
        });
    }
    ;
    prepVis() {
        this.geometry = instancedConnector.clone();
        this.geometry.addAttribute('instanceOffset', new THREE.InstancedBufferAttribute(this.offsets, 3));
        this.geometry.addAttribute('instanceRotation', new THREE.InstancedBufferAttribute(this.rotations, 4));
        this.geometry.addAttribute('instanceColor', new THREE.InstancedBufferAttribute(this.colors, 3));
        this.geometry.addAttribute('instanceScale', new THREE.InstancedBufferAttribute(this.scales, 3));
        this.geometry.addAttribute('instanceVisibility', new THREE.InstancedBufferAttribute(this.visibility, 3));
        this.network = new THREE.Mesh(this.geometry, instanceMaterial);
        this.network.frustumCulled = false;
    }
    ;
    toggleVis() {
        if (this.onscreen) { // if shown in canvas
            scene.remove(this.network);
            this.onscreen = false;
            render();
            canvas.focus();
        }
        else {
            scene.add(this.network);
            this.onscreen = true;
            render();
            canvas.focus();
        }
    }
    ;
    initEdges() {
        //init general color
        const col = backboneColors[this.nid % backboneColors.length];
        // fill vectors for all edges in network
        for (let t = 0; t < this.reducedEdges.total; t++) {
            this.initEdge(t, col);
        }
    }
    ;
    initEdge(t, col) {
        // fill vectors for single edge in network
        let i = this.reducedEdges.p1[t];
        let j = this.reducedEdges.p2[t];
        let pos = this.elemcoords.center(i, j);
        let rot = this.elemcoords.rotation(i, j);
        let dij = this.elemcoords.distance(i, j);
        this.fillVec('offsets', 3, t, [pos.x, pos.y, pos.z]);
        this.fillVec('rotations', 4, t, [rot.w, rot.z, rot.y, rot.x]);
        this.fillVec('colors', 3, t, [col.r, col.g, col.b]);
        this.fillVec('scales', 3, t, [1, dij, 1]);
        this.fillVec('visibility', 3, t, [1, 1, 1]);
    }
    ;
    // Functions above are meant to be more universal
    // Functions below are specific to generating each network, I call these in specific network wrappers in editing.ts
    edgesByCutoff(cutoffValueAngstroms) {
        this.reducedEdges.clearAll();
        this.clearConnections();
        this.selectNetwork();
        //let elems: BasicElement[] = Array.from(selectedBases);
        // go through coordinates and assign connections if 2 particles
        // are less than the cutoff value apart
        let simCutoffValue = cutoffValueAngstroms / 8.518; //sim unit conversion
        for (let i = 0; i < this.elemcoords.xI.length; i++) {
            for (let j = 1; j < this.elemcoords.xI.length; j++) {
                if (i >= j)
                    continue;
                let dij = this.elemcoords.distance(i, j);
                if (dij <= simCutoffValue) {
                    this.reducedEdges.addEdge(i, j, dij, 's', 1);
                }
            }
        }
        // network is ready for solving and visualization
        this.networktype = "ANM";
        if (this.reducedEdges.total != 0) {
            this.initInstances(this.reducedEdges.total);
            this.initEdges();
            this.prepVis();
            this.sendtoUI();
            this.fillConnections();
        }
    }
    ;
    edgesMWCENM() {
        this.reducedEdges.clearAll();
        this.clearConnections();
        this.selectNetwork();
        let pdbindices;
        try {
            pdbindices = this.particles.map(e => { return e.pdbindices; });
        }
        catch (e) {
            notify("PDB Info could not be found. Make sure only AminoAcids are selected and they have been loaded from a PDB file.");
            return;
        }
        let uniqdatasets = new Set(pdbindices.map((a) => { return a[0]; }));
        // let uniqstrands = new Set<Strand>(this.particles.map(x => {return x.strand}));
        // let uniqchains = new Set<any>(pdbindices.map((a) => {return a[1]}));
        this.addBackboneConnections();
        this.addHydrogenBonds(uniqdatasets, pdbindices);
        this.addDisulphideBonds(uniqdatasets, pdbindices);
        this.addNonpolarBonds();
        this.addSaltBridges(7);
        // network is ready for solving and visualization
        this.networktype = "MWCENM";
        if (this.reducedEdges.total != 0) {
            this.initInstances(this.reducedEdges.total);
            this.initEdges();
            this.prepVis();
            this.sendtoUI();
            this.fillConnections();
        }
    }
    ;
    addHydrogenBonds(uniqdatasets, pdbindices) {
        [...uniqdatasets].forEach(ud => {
            let hbonds = pdbFileInfo[ud].hydrogenBonds;
            // let chains = pdbFileInfo[ud].pdbsysinfo;
            let p1, p2; // will be refences to corresponding particles
            let p1found, p2found; // bool indica
            let hbondk = 100; // strength of h bond
            hbonds.forEach((hb, hid) => {
                p1found = false;
                p2found = false;
                pdbindices.forEach((pi, pindx) => {
                    if (pi[0] == ud && pi[1] == hb[0][0] && pi[2] == hb[0][1]) {
                        p1 = this.particles[pindx];
                        p1found = true;
                    }
                    if (pi[0] == ud && pi[1] == hb[1][0] && pi[2] == hb[1][1]) {
                        p2 = this.particles[pindx];
                        p2found = true;
                    }
                });
                if (p1found && p2found) {
                    let p1indx = this.particles.indexOf(p1);
                    let p2indx = this.particles.indexOf(p2);
                    notify("hbond " + p1indx.toString() + " " + p2indx.toString());
                    this.reducedEdges.addEdge(p1indx, p2indx, this.elemcoords.distance(p1indx, p2indx), 's', hbondk);
                }
                else {
                    notify("Hydrogen Bond could not be parsed from pdb info " + hid.toString());
                    return;
                }
            });
        });
    }
    addNonpolarBonds() {
        let nonpolark = 1.0;
        // checks for atoms within 4 residues of one another on two amino acids
        // let nonpolarcheck = function(res1, res2){ // looks for pairs of atoms from different residues within 4 Angstroms
        //
        //     let pi = (res1 as AminoAcid).pdbindices; // location of pdb information
        //     let pdbres1 = pdbFileInfo[pi[0]].pdbsysinfo.filter(chns => {if(chns.chainID == pi[1]) return true;})[0].residues.filter(res => {if (parseInt(res.pdbResIdent) == pi[2]){ return true;} })[0];
        //     let res1atoms = pdbres1.atoms.filter(atom => {if(['CA', 'N', 'H', 'C', 'O'].indexOf(atom.atomType) == -1) return true;}); // sidechain atoms for res1 by filtering out main chain
        //
        //     let ni = (res2 as AminoAcid).pdbindices; // location of pdb information
        //     let pdbres2 = pdbFileInfo[ni[0]].pdbsysinfo.filter(chns => {if(chns.chainID == ni[1]) return true;})[0].residues.filter(res => {if (parseInt(res.pdbResIdent) == ni[2]){ return true;} })[0];
        //     let res2atoms = pdbres2.atoms.filter(atom => {if(['CA', 'N', 'H', 'C', 'O'].indexOf(atom.atomType) == -1) return true;}); // sidechain atoms for res2
        //
        //     let pdbdist = function(atom1, atom2){
        //         return Math.sqrt(Math.pow(atom1.x - atom2.x,2) + Math.pow(atom1.y - atom2.y, 2) + Math.pow(atom1.z - atom2.z, 2));
        //     }
        //
        //     let makenonbonded=false;
        //
        //     res1atoms.forEach(pa => {
        //         res2atoms.forEach(na => {
        //             if(pdbdist(pa, na) < 4){ // 4 A is the cutoff used in the original MWCENM paper
        //                 makenonbonded=true;
        //             }
        //         })
        //     })
        //
        //     return makenonbonded;
        // }
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = 0; j < this.particles.length; j++) {
                if (i >= j)
                    continue;
                if (this.elemcoords.distance(i, j) < 4 / 8.518) { // 4 A is the cutoff used in the original MWCENM paper
                    if (this.particles[i].n3 != this.particles[j] && this.particles[i].n5 != this.particles[j]) {
                        notify("nonpolar Bond " + i.toString() + " " + j.toString());
                        this.reducedEdges.addEdge(i, j, this.elemcoords.distance(i, j), 's', nonpolark);
                    }
                }
            }
        }
    }
    ;
    addSaltBridges(pH = 7) {
        let saltbridgek = 10;
        let catres;
        let anres;
        let catatoms;
        let anatoms;
        if (pH == 7) {
            catres = ["D", "E"]; // aspartic acid and glutamic acid
            catatoms = { "D": ["OD1", "OD2"], "E": ["OE1", "AE1", "OE2", "AE2"] }; // Which atoms might hold the charge
            anres = ["K", "H", "R"]; // Lysine, histidine and Arginine
            anatoms = { "H": ["ND1", "AD1"], "K": ["NZ"], "R": ["NH1", "NH2"] }; // Which atoms might hold the charge
        }
        else {
            notify("No pH besides 7 currently supported");
        }
        let posresidues = this.particles.filter(x => { if (catres.indexOf(x.type) != -1)
            return true; }); // all particles in network that are positive
        let negresidues = this.particles.filter(x => { if (anres.indexOf(x.type) != -1)
            return true; }); // all particles in network that are negative
        let saltbridgecheck = function (posres, negres) {
            let pi = posres.pdbindices; // location of pdb information
            let pospdbres = pdbFileInfo[pi[0]].pdbsysinfo.filter(chns => { if (chns.chainID == pi[1])
                return true; })[0].residues.filter(res => { if (parseInt(res.pdbResIdent) == pi[2]) {
                return true;
            } })[0];
            let posatoms = pospdbres.atoms.filter(atom => { if (catatoms[posres.type].indexOf(atom.atomType) != -1)
                return true; });
            let ni = negres.pdbindices; // location of pdb information
            let negpdbres = pdbFileInfo[ni[0]].pdbsysinfo.filter(chns => { if (chns.chainID == ni[1])
                return true; })[0].residues.filter(res => { if (parseInt(res.pdbResIdent) == ni[2]) {
                return true;
            } })[0];
            let negatoms = negpdbres.atoms.filter(atom => { if (anatoms[negres.type].indexOf(atom.atomType) != -1)
                return true; });
            let pdbdist = function (atom1, atom2) {
                return Math.sqrt(Math.pow(atom1.x - atom2.x, 2) + Math.pow(atom1.y - atom2.y, 2) + Math.pow(atom1.z - atom2.z, 2));
            };
            let makesaltbridge = false;
            posatoms.forEach(pa => {
                negatoms.forEach(na => {
                    if (pdbdist(pa, na) < 4) { // 4 A is the cutoff used in the original MWCENM paper
                        makesaltbridge = true;
                    }
                });
            });
            return makesaltbridge;
        };
        // Checks all combinations of paired residues for
        posresidues.forEach(pr => {
            negresidues.forEach(nr => {
                if (saltbridgecheck(pr, nr)) {
                    let pindx = this.particles.indexOf(pr);
                    let nindx = this.particles.indexOf(nr);
                    notify("salt b " + pindx.toString() + pr.type + " " + nindx.toString() + nr.type);
                    this.reducedEdges.addEdge(pindx, nindx, this.elemcoords.distance(pindx, nindx), 's', saltbridgek);
                }
            });
        });
    }
    ;
    addDisulphideBonds(uniqdatasets, pdbindices) {
        [...uniqdatasets].forEach(ud => {
            let dsbonds = pdbFileInfo[ud].disulphideBonds;
            let p1, p2;
            let p1found, p2found;
            let k = 100; // strength of disulfide bond
            if (dsbonds.length != 0) {
                dsbonds.forEach((db) => {
                    p1found = false;
                    p2found = false;
                    pdbindices.forEach((pi, pindx) => {
                        if (pi[0] == ud && pi[1] == db[0] && pi[2] == db[1]) {
                            p1 = this.particles[pindx];
                            p1found = true;
                        }
                        else if (pi[0] == ud && pi[1] == db[2] && pi[2] == db[3]) {
                            p2 = this.particles[pindx];
                            p2found = true;
                        }
                    });
                    if (p1found && p2found) {
                        let p1indx = this.particles.indexOf(p1); // edges filled by particles position in the particles array of network
                        let p2indx = this.particles.indexOf(p2);
                        this.reducedEdges.addEdge(p1indx, p2indx, this.elemcoords.distance(p1indx, p2indx), 's', k);
                    }
                    else {
                        notify("Disulphide Bond could not be parsed from pdb info");
                        return;
                    }
                });
            }
        });
    }
    ;
    addBackboneConnections() {
        // adds every particles n3 connection if n3 is in the particles array
        let covalentk = 100;
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            if (p.n3 != null) {
                let qind = this.particles.indexOf(p.n3);
                if (qind != -1) {
                    notify("backbone Bond " + i.toString() + " " + qind.toString());
                    this.reducedEdges.addEdge(qind, i, this.elemcoords.distance(i, qind), 's', covalentk);
                }
            }
        }
    }
    ;
    generateHessian() {
        if (this.particles.length > 2000) {
            notify("Large Networks (n>2000) cannot be solved here. Please use the Python scripts provided at URMOM");
            return;
        }
        let hessian = [];
        if (this.reducedEdges.total == 0) {
            notify("Network must be filled prior to solving ANM");
        }
        else {
            //Initialize Empty Hessian (3Nx3N)
            let tmp = new Array(3 * this.particles.length); //3N
            for (let i = 0; i < 3 * this.particles.length; i++) { //3N x
                hessian.push(tmp.slice());
                for (let j = 0; j < 3 * this.particles.length; j++) {
                    hessian[i][j] = 0;
                }
            }
            //Hessian Calc w/ Masses
            for (let l = 0; l < this.reducedEdges.total; l++) {
                let i = this.reducedEdges.p1[l], j = this.reducedEdges.p2[l], k = this.reducedEdges.ks[l];
                let mi = this.masses[i];
                let mj = this.masses[j];
                let mij = Math.sqrt(mi * mj); //masses
                let mi2 = mi * mi;
                let mj2 = mj * mj;
                let d = this.elemcoords.distance(i, j); //distances
                let d2 = d * d;
                let diff = this.elemcoords.diff(i, j);
                let diag = diff.clone().multiply(diff).multiplyScalar(k).divideScalar(d2);
                let xy = k * (diff.x * diff.y) / d2;
                let xz = k * (diff.x * diff.z) / d2;
                let yz = k * (diff.y * diff.z) / d2;
                // Couldn't find a more pleasant way to do this
                // Fills 1 element in hij, hji, hii, hjj on each line
                // Verified this returns correct Hessian
                hessian[3 * i][3 * j] -= diag.x / mij;
                hessian[3 * j][3 * i] -= diag.x / mij;
                hessian[3 * i][3 * i] += diag.x / mi2;
                hessian[3 * j][3 * j] += diag.x / mj2;
                hessian[3 * i][3 * j + 1] -= xy / mij;
                hessian[3 * j + 1][3 * i] -= xy / mij;
                hessian[3 * i][3 * i + 1] += xy / mi2;
                hessian[3 * j + 1][3 * j] += xy / mj2;
                hessian[3 * i][3 * j + 2] -= xz / mij;
                hessian[3 * j + 2][3 * i] -= xz / mij;
                hessian[3 * i][3 * i + 2] += xz / mi2;
                hessian[3 * j + 2][3 * j] += xz / mj2;
                hessian[3 * i + 1][3 * j] -= xy / mij;
                hessian[3 * j][3 * i + 1] -= xy / mij;
                hessian[3 * i + 1][3 * i] += xy / mi2;
                hessian[3 * j][3 * j + 1] += xy / mj2;
                //fine
                hessian[3 * i + 1][3 * j + 1] -= diag.y / mij;
                hessian[3 * j + 1][3 * i + 1] -= diag.y / mij;
                hessian[3 * i + 1][3 * i + 1] += diag.y / mi2;
                hessian[3 * j + 1][3 * j + 1] += diag.y / mj2;
                hessian[3 * i + 1][3 * j + 2] -= yz / mij;
                hessian[3 * j + 2][3 * i + 1] -= yz / mij;
                hessian[3 * i + 1][3 * i + 2] += yz / mi2;
                hessian[3 * j + 2][3 * j + 1] += yz / mj2;
                hessian[3 * i + 2][3 * j] -= xz / mij;
                hessian[3 * j][3 * i + 2] -= xz / mij;
                hessian[3 * i + 2][3 * i] += xz / mi2;
                hessian[3 * j][3 * j + 2] += xz / mj2;
                hessian[3 * i + 2][3 * j + 1] -= yz / mij;
                hessian[3 * j + 1][3 * i + 2] -= yz / mij;
                hessian[3 * i + 2][3 * i + 1] += yz / mi2;
                hessian[3 * j + 1][3 * j + 2] += yz / mj2;
                //fine
                hessian[3 * i + 2][3 * j + 2] -= diag.z / mij;
                hessian[3 * j + 2][3 * i + 2] -= diag.z / mij;
                hessian[3 * i + 2][3 * i + 2] += diag.z / mi2;
                hessian[3 * j + 2][3 * j + 2] += diag.z / mj2;
            }
            return hessian;
        }
    }
    ;
    invertHessian(hessian) {
        let r = SVD(hessian, true, true, 1e-10);
        let u = r['orderu'], q = r['q'], vt = r['ordervt']; //v needs to be transposed
        let tol = 0.000001;
        // Make diagonal of inverse eigenvalues
        let invq = [];
        for (let i = 0; i < 3 * this.particles.length; i++) { //3N x
            let tmp = new Array(3 * this.particles.length); //3N
            for (let j = 0; j < 3 * this.particles.length; j++) {
                tmp[j] = 0;
            }
            invq.push(tmp);
        }
        //make diagonal
        for (let i = 0; i < q.length; i++) {
            let qval = q[i];
            if (qval < tol)
                invq[i][i] = 0;
            else
                invq[i][i] = 1 / qval;
        }
        // helper functions https://stackoverflow.com/questions/27205018/multiply-2-matrices-in-javascript
        function matrixDot(A, B) {
            var result = new Array(A.length).fill(0).map(row => new Array(B[0].length).fill(0));
            return result.map((row, i) => {
                return row.map((val, j) => {
                    return A[i].reduce((sum, elm, k) => sum + (elm * B[k][j]), 0);
                });
            });
        }
        // multiply
        let nf = matrixDot(u, invq); //  U*q
        // Calculate U q+ V+ (Psuedo-Inverse)
        return matrixDot(nf, vt); // U*q*Vt
    }
    ;
    getRMSF(inverse, temp) {
        let RMSF = [];
        for (let i = 0; i < inverse.length / 3; i++) { //for each particle
            let r = this.kb * temp * (inverse[3 * i][3 * i] + inverse[3 * i + 1][3 * i + 1] + inverse[3 * i + 2][3 * i + 2]); //A^2
            RMSF.push(r);
        }
        return RMSF;
    }
    ;
    fillConnections() {
        if (this.reducedEdges.total != 0) {
            this.particles.forEach(p => p.connections = []); // Empty whatever connections were there, assumes particles only belong to one network
            this.reducedEdges.p1.forEach((one, idx) => {
                let ptwo = this.particles[this.reducedEdges.p2[idx]];
                this.particles[one].connections.push(ptwo);
            });
        }
    }
    ;
    clearConnections() {
        this.particles.forEach(p => p.connections = []); // Empty whatever connections were there, assumes particles only belong to one network
    }
    ;
}
