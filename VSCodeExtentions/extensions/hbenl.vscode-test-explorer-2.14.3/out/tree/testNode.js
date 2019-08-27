"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const state_1 = require("./state");
const util_1 = require("../util");
class TestNode {
    constructor(collection, info, parent, oldNodesById) {
        this.collection = collection;
        this.info = info;
        this.parent = parent;
        this._log = "";
        this._decorations = [];
        this.children = [];
        this.fileUri = util_1.normalizeFilename(info.file);
        this.description = info.description;
        this.tooltip = info.tooltip;
        const oldNode = oldNodesById ? oldNodesById.get(info.id) : undefined;
        if (oldNode && (oldNode.info.type === 'test')) {
            let currentState = oldNode.state.current;
            if (info.skipped) {
                currentState = 'always-skipped';
            }
            else if ((currentState === 'always-skipped') || (currentState === 'duplicate')) {
                currentState = 'pending';
            }
            let previousState = oldNode.state.previous;
            if (info.skipped) {
                previousState = 'always-skipped';
            }
            else if ((previousState === 'always-skipped') || (previousState === 'duplicate')) {
                previousState = 'pending';
            }
            this._state = {
                current: currentState,
                previous: previousState,
                autorun: oldNode.state.autorun
            };
            this._log = oldNode.log || "";
        }
        else {
            this._state = state_1.defaultState(info.skipped);
            this._log = "";
        }
    }
    get state() { return this._state; }
    get log() { return this._log; }
    get decorations() { return this._decorations; }
    get adapterIds() { return [this.info.id]; }
    setCurrentState(currentState, logMessage, decorations, description, tooltip) {
        this.state.current = currentState;
        if ((currentState === 'passed') || (currentState === 'failed') ||
            (currentState === 'duplicate') || (currentState === 'errored') ||
            ((currentState === 'skipped') && (this.state.previous !== 'always-skipped'))) {
            this.state.previous = currentState;
        }
        let logChanged = false;
        if (currentState === 'scheduled') {
            this._log = "";
            this._decorations = [];
            logChanged = true;
        }
        if (logMessage) {
            this._log += logMessage + "\n";
            logChanged = true;
        }
        if (logChanged) {
            this.collection.explorer.logChanged(this);
        }
        if (decorations) {
            this._decorations = this._decorations.concat(decorations);
        }
        if (description !== undefined) {
            this.description = description;
        }
        if (tooltip !== undefined) {
            this.tooltip = tooltip;
        }
        this.sendStateNeeded = true;
        if (this.parent) {
            this.parent.recalcStateNeeded = true;
        }
        this.collection.sendNodeChangedEvents();
        if (this.fileUri) {
            this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
        }
    }
    retireState() {
        if ((this.state.current === 'passed') || (this.state.current === 'failed') ||
            (this.state.current === 'skipped') || (this.state.current === 'errored')) {
            this._state.current = 'pending';
            this.sendStateNeeded = true;
            if (this.fileUri) {
                this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
            }
        }
    }
    resetState() {
        this._log = "";
        if ((this.state.current !== 'pending') && (this.state.current !== 'always-skipped') && (this.state.current !== 'duplicate')) {
            this._state.current = 'pending';
            this.sendStateNeeded = true;
        }
        if ((this.state.previous !== 'pending') && (this.state.previous !== 'always-skipped') && (this.state.previous !== 'duplicate')) {
            this._state.previous = 'pending';
            this.sendStateNeeded = true;
        }
        if ((this.description !== this.info.description) || (this.tooltip !== this.info.tooltip)) {
            this.description = this.info.description;
            this.tooltip = this.info.tooltip;
            this.sendStateNeeded = true;
        }
        if (this._decorations.length > 0) {
            this._decorations = [];
            if (this.fileUri) {
                this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
            }
        }
        this.collection.explorer.logChanged(this);
    }
    setAutorun(autorun) {
        this._state.autorun = autorun;
        this.sendStateNeeded = true;
    }
    getTreeItem() {
        this.sendStateNeeded = false;
        const treeItem = new vscode.TreeItem(this.info.label, vscode.TreeItemCollapsibleState.None);
        treeItem.id = this.uniqueId;
        treeItem.iconPath = this.collection.explorer.iconPaths[state_1.stateIcon(this.state)];
        treeItem.contextValue = this.collection.adapter.debug ?
            (this.fileUri ? 'debuggableTestWithSource' : 'debuggableTest') :
            (this.fileUri ? 'testWithSource' : 'test');
        treeItem.command = {
            title: '',
            command: 'test-explorer.show-log',
            arguments: [[this]]
        };
        treeItem.description = this.description;
        treeItem.tooltip = this.tooltip;
        return treeItem;
    }
}
exports.TestNode = TestNode;
//# sourceMappingURL=testNode.js.map