"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const state_1 = require("./state");
const testNode_1 = require("./testNode");
const util_1 = require("../util");
class TestSuiteNode {
    constructor(collection, info, parent, isMergedNode, oldNodesById) {
        this.collection = collection;
        this.info = info;
        this.parent = parent;
        this.isMergedNode = isMergedNode;
        this.log = undefined;
        this.fileUri = util_1.normalizeFilename(info.file);
        this.description = info.description;
        this.tooltip = info.tooltip;
        if (!this.collection.shouldMergeSuites()) {
            this._children = info.children.map(childInfo => {
                if (childInfo.type === 'test') {
                    return new testNode_1.TestNode(collection, childInfo, this, oldNodesById);
                }
                else {
                    return new TestSuiteNode(collection, childInfo, this, false, oldNodesById);
                }
            });
        }
        else {
            this._children = util_1.groupSuitesByLabel(info.children).map(childInfos => {
                if (!Array.isArray(childInfos)) {
                    return new testNode_1.TestNode(collection, childInfos, this, oldNodesById);
                }
                else {
                    if (childInfos.length === 1) {
                        return new TestSuiteNode(collection, childInfos[0], this, false, oldNodesById);
                    }
                    else {
                        const mergedSuite = new TestSuiteNode(collection, util_1.mergeSuiteInfos(childInfos), this, true, oldNodesById);
                        mergedSuite._children = childInfos.map(childInfo => new TestSuiteNode(collection, childInfo, mergedSuite, false, oldNodesById));
                        return mergedSuite;
                    }
                }
            });
        }
        this._state = state_1.parentNodeState(this._children);
    }
    get state() { return this._state; }
    get children() { return this._children; }
    get adapterIds() {
        if (this.isMergedNode) {
            return util_1.getAdapterIds(this._children);
        }
        else {
            return [this.info.id];
        }
    }
    get isHidden() { return (this.parent !== undefined) && this.parent.isMergedNode; }
    update(description, tooltip) {
        if ((description !== undefined) && (description !== this.description)) {
            this.description = description;
            this.sendStateNeeded = true;
        }
        if ((tooltip !== undefined) && (tooltip !== this.tooltip)) {
            this.tooltip = tooltip;
            this.sendStateNeeded = true;
        }
    }
    recalcState() {
        for (const child of this.children) {
            if (child instanceof TestSuiteNode) {
                child.recalcState();
            }
        }
        if (this.recalcStateNeeded) {
            const newCurrentNodeState = state_1.parentCurrentNodeState(this.children);
            const newPreviousNodeState = state_1.parentPreviousNodeState(this.children);
            const newAutorunFlag = state_1.parentAutorunFlag(this.children);
            if ((this.state.current !== newCurrentNodeState) ||
                (this.state.previous !== newPreviousNodeState) ||
                (this.state.autorun !== newAutorunFlag)) {
                this.state.current = newCurrentNodeState;
                this.state.previous = newPreviousNodeState;
                this.state.autorun = newAutorunFlag;
                this.sendStateNeeded = true;
                if (this.parent) {
                    this.parent.recalcStateNeeded = true;
                }
                if (this.fileUri) {
                    this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
                }
            }
            this.recalcStateNeeded = false;
        }
    }
    retireState() {
        for (const child of this._children) {
            child.retireState();
        }
        this.recalcStateNeeded = true;
    }
    resetState() {
        if ((this.description !== this.info.description) || (this.tooltip !== this.info.tooltip)) {
            this.description = this.info.description;
            this.tooltip = this.info.tooltip;
            this.sendStateNeeded = true;
        }
        for (const child of this._children) {
            child.resetState();
        }
        this.recalcStateNeeded = true;
    }
    setAutorun(autorun) {
        for (const child of this._children) {
            child.setAutorun(autorun);
        }
        this.recalcStateNeeded = true;
    }
    getTreeItem() {
        if (this.recalcStateNeeded) {
            this.recalcState();
        }
        this.sendStateNeeded = false;
        let label = this.info.label;
        if ((this.parent === undefined) && this.collection.adapter.workspaceFolder &&
            vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1)) {
            label = `${this.collection.adapter.workspaceFolder.name} - ${label}`;
        }
        const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.id = this.uniqueId;
        treeItem.iconPath = this.collection.explorer.iconPaths[state_1.stateIcon(this.state)];
        treeItem.contextValue = this.parent ? (this.fileUri ? 'suiteWithSource' : 'suite') : 'collection';
        treeItem.description = this.description;
        treeItem.tooltip = this.tooltip;
        return treeItem;
    }
}
exports.TestSuiteNode = TestSuiteNode;
//# sourceMappingURL=testSuiteNode.js.map