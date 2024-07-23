import React, { useState, useEffect, useRef } from 'react';
import socketService from '../SocketService';
import Vex from 'vexflow';
import * as Tone from 'tone';

const MusicSheetPage: React.FC = () => {
  const [notes, setNotes] = useState<{note: number, time: number}[]>(Array.from({ length: 64 }, (_, index) => ({ note: -1, time: index + 1 })));
  const vexRef = useRef<HTMLDivElement>(null);
  const noteMap = ['d#/5', 'd/5', 'c#/5', 'c/5', 'b/4', 'a#/4', 'a/4', 'g#/4', 'g/4', 'f#/4', 'f/4', 'e/4', 'd#/4', 'd/4', 'c#/4', 'c/4'];
  const toneMap = ['D#5', 'D5', 'C#5', 'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'];

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
    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Modifier } = Vex.Flow;
  
    const div = vexRef.current!;
    div.innerHTML = '';
    const createRenderer = (width: number, height: number) => {
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(width, height);
      return renderer.getContext();
    }

    const context1 = createRenderer(2000, 140);
    const context2 = createRenderer(2000, 140);

    const staveWidth = 800;

    const stave1 = new Stave(10, 40, staveWidth);
    const stave2 = new Stave(810, 40, staveWidth);
    const stave3 = new Stave(10, 40, staveWidth);
    const stave4 = new Stave(810, 40, staveWidth);
  
    stave1.addClef("treble").addTimeSignature("4/4");
    stave1.setContext(context1).draw();
    stave2.setContext(context1).draw();
    stave3.addClef("treble");
    stave3.setContext(context2).draw();
    stave4.setContext(context2).draw();
  
    const transformNotes = (notes: { note: number; time: number }[]): Vex.Flow.StaveNote[] => {
      const { StaveNote } = Vex.Flow;
    
      let transformedNotes: Vex.Flow.StaveNote[] = [];
      let currentNote = notes[0];
      let count = 0;
      let time = 0;
    
      const addNote = (note: { note: number; time: number }, duration: string) => {
        const noteValue = note.note === -1 ? `${duration}r` : duration;
        const newNote = new StaveNote({
          clef: 'treble',
          keys: note.note === -1 ? (duration === '1' ? ["d/5"] : ["b/4"] ): [noteMap[note.note]],
          duration: noteValue
        });
        if (note.note !== -1 && noteMap[note.note].includes('#')) {
          newNote.addModifier(new Accidental("#")) as unknown as typeof StaveNote;
        }
        transformedNotes.push(newNote);
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
  
    const transformedNotes = transformNotes(notes);
  
    const voice1 = new Voice({ num_beats: 4, beat_value: 4 });
    const voice2 = new Voice({ num_beats: 4, beat_value: 4 });
    const voice3 = new Voice({ num_beats: 4, beat_value: 4 });
    const voice4 = new Voice({ num_beats: 4, beat_value: 4 });
  
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

    formatter.joinVoices([voice1]).format([voice1], staveWidth);
    formatter.joinVoices([voice2]).format([voice2], staveWidth);
    formatter.joinVoices([voice3]).format([voice3], staveWidth);
    formatter.joinVoices([voice4]).format([voice4], staveWidth);

    const centerAlignSingleNote = (voice: Vex.Flow.Voice, stave: Vex.Flow.Stave) => {
      const tickables = voice.getTickables();
      if (tickables.length === 1) {
        const singleNote = tickables[0] as Vex.Flow.StaveNote;
        const centerX = staveWidth / 2;
        const noteX = singleNote.getAbsoluteX();
        const shiftX = centerX - noteX;
        singleNote.setXShift(shiftX);
      }
    };

    centerAlignSingleNote(voice1, stave1);
    centerAlignSingleNote(voice2, stave2);
    centerAlignSingleNote(voice3, stave3);
    centerAlignSingleNote(voice4, stave4);

    voice1.draw(context1, stave1);
    voice2.draw(context1, stave2);
    voice3.draw(context2, stave3);
    voice4.draw(context2, stave4);
  };
  
  const handleCellClick = (row: number, col: number) => {
    const time = col;
    addNote(row, time);
  };


  const exportToWAV = async () => {
    const synth = new Tone.Synth().toDestination();
    const now = Tone.now();

    notes.forEach((note, index) => {
      if (note.note !== -1) {
        const noteName = toneMap[note.note];
        const time = index*0.25;
        synth.triggerAttackRelease(noteName, '16n', now + time);
      }
    });

    await Tone.start();
    const recorder = new Tone.Recorder();
    synth.connect(recorder);
    recorder.start();

    setTimeout(async () => {
      const recording = await recorder.stop();
      const url = URL.createObjectURL(recording);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'music.wav';
      a.click();
    }, notes.length * 250);
  };

  return (
    <div className="p-4" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="mt-4" style={{ width: '90%', display: 'flex' }}>
        <div className="piano" style={{ width: '10%', display: 'grid', gridTemplateRows: 'repeat(16, 1fr)', gap: '0' }}>
          {['D#5', 'D5', 'C#5', 'C5', 'B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'].map((note, index) => (
            <div key={index} style={{ height: '100%', backgroundColor: ['C#', 'D#', 'F#', 'G#', 'A#', 'C#5', 'D#5'].includes(note) ? 'black' : 'white', color: ['C#', 'D#', 'F#', 'G#', 'A#', 'C#5', 'D#5'].includes(note) ? 'white' : 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {note}
            </div>
          ))}
        </div>
        <div className="mt-4" style={{ width: '90%', display: 'grid', gridTemplateColumns: 'repeat(64, 1fr)', gap: '0' }}>
          {Array.from({ length: 16 }).map((_, row) =>
            Array.from({ length: 64 }).map((_, col) => (
              <button
                key={`${row}-${col}`}
                className="border border-gray-300"
                onClick={() => handleCellClick(row, col)}
                style={{
                  backgroundColor: notes.some(note => noteMap[note.note] === noteMap[row] && note.time === col) ? 'black' : 'white',
                  width: '100%',
                  height: '0',
                  paddingBottom: '100%'
                }}
              >
              </button>
            ))
          )}
        </div>
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
      <button 
        onClick={exportToWAV} 
        className="bg-green-500 text-white py-2 px-4 rounded mt-4"
      >
        Export to WAV
      </button>
    </div>
  );
}

export default MusicSheetPage;
