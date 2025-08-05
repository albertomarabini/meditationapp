// /src/delegates/UndoRedoStackManager.ts

export class UndoRedoStackManager {
  private _undoStack: string[];
  private _redoStack: string[];
  private _currentContent: string;

  constructor(initialContent: string) {
    this._undoStack = [];
    this._redoStack = [];
    this._currentContent = initialContent;
  }

  get undoStack(): string[] {
    return this._undoStack;
  }

  get redoStack(): string[] {
    return this._redoStack;
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  get currentContent(): string {
    return this._currentContent;
  }

  pushChange(newContent: string): void {
    if (newContent !== this._currentContent) {
      this._undoStack.push(this._currentContent);
      this._redoStack = [];
      this._currentContent = newContent;
    }
  }

  undo(): string | null {
    if (this._undoStack.length === 0) return null;
    this._redoStack.unshift(this._currentContent);
    const prev = this._undoStack.pop()!;
    this._currentContent = prev;
    return prev;
  }

  redo(): string | null {
    if (this._redoStack.length === 0) return null;
    this._undoStack.push(this._currentContent);
    const next = this._redoStack.shift()!;
    this._currentContent = next;
    return next;
  }

  clear(): void {
    this._undoStack = [];
    this._redoStack = [];
    this._currentContent = '';
  }
}
