import * as Y from 'yjs';

export class CRDTCanvas {
  ydoc: Y.Doc;
  drawing: Y.Array<Y.Map<any>>;

  constructor() {
    this.ydoc = new Y.Doc();
    this.drawing = this.ydoc.getArray('drawing');
  }

  addDrawOperation(op: any) {
    const map = new Y.Map();
    map.set('op', op);
    this.drawing.push([map]);
  }

  getOperations() {
    return this.drawing.toArray().map((map: Y.Map<any>) => map.get('op'));
  }

  onDraw(callback: (op: any) => void) {
    this.drawing.observe(event => {
      event.changes.added.forEach(item => {
        const op = item.content.getContent()[0].get('op');
        callback(op);
      });
    });
  }
}
