import React, { useState, useEffect, useRef } from 'react';
import socketService from '../SocketService';
import Vex from 'vexflow';
import { render } from '@testing-library/react';

const MusicSheetPage: React.FC = () => {
  const [notes, setNotes] = useState<{note: number, time: number}[]>(Array.from({ length: 64 }, (_, index) => ({ note: -1, time: index + 1 })));
  const vexRef = useRef<HTMLDivElement>(null);
  const noteMap = ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'];

  useEffect(() => {
    renderSheetMusic(notes);
    socketService.on('updateSheet', (newNotes: {note: number, time: number}[]) => {
      setNotes(newNotes);
      renderSheetMusic(newNotes);
    });

    return () => {
      socketService.off('updateSheet');
    };
  }, []);

  const addNote = (note: number, time: number) => {
    const newNote = {note, time};
    socketService.emit('addNote', newNote);
  };

  const clearNotes = () => {
    socketService.emit('clearNotes');
  };

  const renderSheetMusic = (notes : { note: number; time: number }[]) => {
    const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;
  
    const div = vexRef.current!;
    div.innerHTML = '';
    const createRenderer = (width: number, height: number) => {
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(width, height);
      return renderer.getContext();
    }

    const context1 = createRenderer(1000, 200);
    const context2 = createRenderer(1000, 200);
    const context3 = createRenderer(1000, 200);
    const context4 = createRenderer(1000, 200);

    const staveWidth = 800;

    const stave1 = new Stave(0, 40, staveWidth);
    const stave2 = new Stave(0, 40, staveWidth);
    const stave3 = new Stave(0, 40, staveWidth);
    const stave4 = new Stave(0, 40, staveWidth);
  
    stave1.addClef("treble").addTimeSignature("4/4");
    stave1.setContext(context1).draw();
    stave2.setContext(context2).draw();
    stave3.setContext(context3).draw();
    stave4.setContext(context4).draw();
  
    // 음표 변환 함수
    const transformNotes = (notes: { note: number; time: number }[]): Vex.Flow.StaveNote[] => {
      const { StaveNote } = Vex.Flow;
    
      let transformedNotes: Vex.Flow.StaveNote[] = [];
      let currentNote = notes[0];
      let count = 0;
      let time = 0;
    
      const addNote = (note: { note: number; time: number }, duration: string) => {
        const noteValue = note.note === -1 ? `${duration}r` : duration;
        transformedNotes.push(new StaveNote({
          clef: 'treble',
          keys: note.note === -1 ? ["b/4"] : [noteMap[note.note]],
          duration: noteValue
        }));
      };
    
      for (let i = 0; i < notes.length; i++) {
        if (count !== 0 && ((time+count) % 16 === 0 || notes[i].note !== currentNote.note)) { 
          while (count >= 16) {
            const duration = "1";
            addNote(currentNote, duration);
            count -= 16;
            time += 16;
          }
          while (count >= 8) {
            const duration = "2";
            addNote(currentNote, duration);
            count -= 8;
            time += 8;
          }
          while (count >= 4) {
            const duration = "4";
            addNote(currentNote, duration);
            count -= 4;
            time += 4;
          }
          while (count >= 2) {
            const duration = "8";
            addNote(currentNote, duration);
            count -= 2;
            time += 2;
          }
          if (count === 1) {
            const duration = "16";
            addNote(currentNote, duration);
            time += 1;
          }
          currentNote = notes[i];
          count = 1;
        }
        else {
          currentNote = notes[i];
          count++;
          if (count === 16) {
            const duration = "1";
            addNote(currentNote, duration);
            count = 0;
            time += 16;
          }
        }
      }

      // accounting for the last note
      if (count !== 0) {
        while (count >= 16) {
          const duration = "1";
          addNote(currentNote, duration);
          count -= 16;
          time += 16;
        }
        while (count >= 8) {
          const duration = "2";
          addNote(currentNote, duration);
          count -= 8;
          time += 8;
        }
        while (count >= 4) {
          const duration = "4";
          addNote(currentNote, duration);
          count -= 4;
          time += 4;
        }
        while (count >= 2) {
          const duration = "8";
          addNote(currentNote, duration);
          count -= 2;
          time += 2;
        }
        if (count === 1) {
          const duration = "16";
          addNote(currentNote, duration);
          time += 1;
        }
      }

      console.log('total time: '+time);
    
      return transformedNotes;
    };
    
  
    // 음표 배열 변환
    const transformedNotes = transformNotes(notes);
  
    const voice1 = new Voice({ num_beats: 4, beat_value: 4 });
    const voice2 = new Voice({ num_beats: 4, beat_value: 4 });
    const voice3 = new Voice({ num_beats: 4, beat_value: 4 });
    const voice4 = new Voice({ num_beats: 4, beat_value: 4 });
  
    // 음표를 4개의 마디에 분배
    let time = 0;
    for (let i = 0; i < transformedNotes.length; i++) {
      const duration = transformedNotes[i].getDuration();
      if (duration === "1") time += 16;
      else if (duration === "2") time += 8;
      else if (duration === "4") time += 4;
      else if (duration === "8") time += 2;
      else time += 1;

      if (time <= 16) {
        voice1.addTickable(transformedNotes[i]);
      } else if (time <= 32) {
        voice2.addTickable(transformedNotes[i]);
      } else if (time <= 48) {
        voice3.addTickable(transformedNotes[i]);
      } else {
        voice4.addTickable(transformedNotes[i]);
      }
    }
  
    const formatter = new Formatter();
  
    formatter.joinVoices([voice1]).format([voice1], 190);
    formatter.joinVoices([voice2]).format([voice2], 190);
    formatter.joinVoices([voice3]).format([voice3], 190);
    formatter.joinVoices([voice4]).format([voice4], 190);
  
    voice1.draw(context1, stave1);
    voice2.draw(context2, stave2);
    voice3.draw(context3, stave3);
    voice4.draw(context4, stave4);
  };
  
  

  const handleCellClick = (row: number, col: number) => {
    const time = col; // 각 열이 16분음표 시간을 나타냅니다.
    addNote(row, time);
  };

  return (
    <div className="p-4" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="mt-4" style={{ width: '90%', display: 'grid', gridTemplateColumns: 'repeat(64, 1fr)', gap: '0' }}>
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 64 }).map((_, col) => (
            <button
              key={`${row}-${col}`}
              className="border border-gray-300"
              onClick={() => handleCellClick(row, col)}
              style={{
                backgroundColor: notes.some(note => noteMap[note.note] === ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'][row] && note.time === col) ? 'black' : 'white',
                width: '100%',
                height: '0',
                paddingBottom: '100%'
              }}
            >
            </button>
          ))
        )}
      </div>
      <div className="mt-4" style={{ width: '90%' }}>
        <div ref={vexRef}/>
      </div>
      <button 
        onClick={clearNotes} 
        className="bg-red-500 text-white py-2 px-4 rounded mt-4"
      >
        Clear
      </button>
    </div>
  );
}

export default MusicSheetPage;
