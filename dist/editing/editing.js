const instanceParams = new Map([
    ['cmOffsets', 3], ['bbOffsets', 3], ['nsOffsets', 3],
    ['nsRotation', 4], ['conOffsets', 3], ['conRotation', 4],
    ['bbconOffsets', 3], ['bbconRotation', 4], ['bbColors', 3],
    ['scales', 3], ['nsScales', 3], ['conScales', 3], ['bbconScales', 3],
    ['visibility', 3], ['nsColors', 3], ['bbLabels', 3]
]);
class InstanceCopy {
    constructor(e) {
        instanceParams.forEach((size, attr) => {
            if (size == 3) {
                this[attr] = e.getInstanceParameter3(attr);
            }
            else { // 4
                this[attr] = e.getInstanceParameter4(attr);
            }
        });
        this.type = e.type;
        this.gid = e.gid;
        this.n3gid = e.neighbor3 ? e.neighbor3.gid : -1;
        this.n5gid = e.neighbor5 ? e.neighbor5.gid : -1;
        this.elemType = e.constructor;
        this.system = e.getSystem();
    }
    writeToSystem(sid, sys) {
        instanceParams.forEach((size, attr) => {
            sys.fillVec(attr, size, sid, this[attr].toArray());
        });
    }
}
let copied = [];
function copyWrapper() {
    if (listBases.length == 0) {
        notify("Please select monomers to copy");
        return;
    }
    let toCopy = listBases; // Save so that we can clear the selection
    clearSelection();
    copied = toCopy.map(i => new InstanceCopy(elements.get(i)));
}
function cutWrapper() {
    if (listBases.length == 0) {
        notify("Please select monomers to copy");
        return;
    }
    let elems = listBases.map(i => elements.get(i)); // Save so that we can clear the selection
    clearSelection();
    copied = elems.map(e => new InstanceCopy(e));
    editHistory.do(new RevertableDeletion(elems));
    topologyEdited = true;
}
function pasteWrapper(keepPos) {
    if (copied.length == 0) {
        notify("Nothing is copied, so nothing to paste");
        return;
    }
    let pos;
    if (!keepPos) {
        // Set paste destination to 20 units in front of the camera
        const cameraHeading = new THREE.Vector3(0, 0, -1);
        cameraHeading.applyQuaternion(camera.quaternion);
        pos = camera.position.clone().add(cameraHeading.clone().multiplyScalar(20));
    }
    // Add elements to scene
    let elems = edit.addElementsAt(copied, pos);
    // Add to history
    editHistory.add(new RevertableAddition(copied, elems, pos));
    topologyEdited = true;
}
function nickWrapper() {
    let e = elements.get(listBases.slice(-1)[0]);
    if (e == undefined) {
        notify("Please select a monomer to nick at");
        return;
    }
    editHistory.do(new RevertableNick(e));
    topologyEdited = true;
}
function ligateWrapper() {
    let ids = listBases.slice(-2);
    let e = [elements.get(ids[0]), elements.get(ids[1])];
    if (e[0] == undefined || e[1] == undefined) {
        notify("Please select two monomers to ligate");
        return;
    }
    editHistory.do(new RevertableLigation(e[0], e[1]));
    topologyEdited = true;
}
function extendWrapper() {
    let e = elements.get(listBases.slice(-1)[0]);
    let seq = document.getElementById("sequence").value.toUpperCase();
    if (e == undefined) {
        notify("Please select a monomer to extend from");
        return;
    }
    if (seq == "") {
        notify("Please type a sequence into the box");
        return;
    }
    let elems = edit.extendStrand(e, seq);
    let instanceCopies = elems.map(e => { return new InstanceCopy(e); });
    let pos = new THREE.Vector3();
    elems.forEach(e => pos.add(e.getInstanceParameter3("cmOffsets")));
    pos.divideScalar(elems.length);
    // Add to history
    editHistory.add(new RevertableAddition(instanceCopies, elems, pos));
    topologyEdited = true;
}
function createWrapper() {
    let seq = document.getElementById("sequence").value.toUpperCase();
    if (seq == "") {
        notify("Please type a sequence into the box");
        return;
    }
    let elems = edit.createStrand(seq);
    let instanceCopies = elems.map(e => { return new InstanceCopy(e); });
    let pos = new THREE.Vector3();
    elems.forEach(e => pos.add(e.getInstanceParameter3("cmOffsets")));
    pos.divideScalar(elems.length);
    // Add to history
    editHistory.add(new RevertableAddition(instanceCopies, elems, pos));
    topologyEdited = true;
}
function deleteWrapper() {
    let e = listBases.map(i => elements.get(i));
    clearSelection();
    if (e == []) {
        notify("Please select monomers to delete");
        return;
    }
    editHistory.do(new RevertableDeletion(e));
    topologyEdited = true;
}
function setSeqWrapper() {
    let seq = document.getElementById("sequence").value.toUpperCase();
    let setCompl = document.getElementById("setCompl").checked;
    if (seq == "") {
        notify("Please type a sequence into the box");
        return;
    }
    let e = listBases.map(i => elements.get(i));
    let n = [];
    e.forEach(elem => {
        if (elem instanceof Nucleotide) {
            n.push(elem);
        }
    });
    if (n.length == 0) {
        notify("Please select nucleotides to apply sequence to");
        return;
    }
    if (n.length > seq.length) {
        notify("Sequence is shorter than the selection");
        return;
    }
    editHistory.do(new RevertableSequenceEdit(n, seq, setCompl));
    topologyEdited = true;
}
