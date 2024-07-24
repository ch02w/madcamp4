import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/SocketService';
import Timer from '../components/Timer';
import Vex from 'vexflow';
import * as Tone from 'tone';
import NFTMintingModal from '../components/NFTMintingModal';

const MusicSheetPage: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [notes, setNotes] = useState<{note: number, time: number}[]>(Array.from({ length: 64 }, (_, index) => ({ note: -1, time: index + 1 })));
  const vexRef = useRef<HTMLDivElement>(null);
  const noteMap = ['d#/5', 'd/5', 'c#/5', 'c/5', 'b/4', 'a#/4', 'a/4', 'g#/4', 'g/4', 'f#/4', 'f/4', 'e/4', 'd#/4', 'd/4', 'c#/4', 'c/4'];
  const toneMap = ['D#5', 'D5', 'C#5', 'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'];
  const [bpm, setBPM] = useState(60);
  const [wave, setWave] = useState('sine');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadURL, setDownloadURL] = useState<string>('');
  const [imageURL, setImageURL] = useState<string>('');


  useEffect(() => {
    socketService.on('remainingTime', (time: number) => {
      setRemainingTime(time);
    });

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
    const { Renderer, Stave, Voice, Formatter, Accidental } = Vex.Flow;
  
    const div = vexRef.current!;
    div.innerHTML = '';
    const createRenderer = (width: number, height: number) => {
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const res =  renderer.getContext();
      res.setFillStyle('#9800FF');
      res.setStrokeStyle('#9800FF');
      return res;
    }

    const context1 = createRenderer(2000, 140);
    const context2 = createRenderer(2000, 140);

    const staveWidth = 800;

    const stave1 = new Stave(10, 40, staveWidth, {fill_style: '#00FF2E'});
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

    formatter.joinVoices([voice1]).format([voice1], staveWidth-100);
    formatter.joinVoices([voice2]).format([voice2], staveWidth-100);
    formatter.joinVoices([voice3]).format([voice3], staveWidth-100);
    formatter.joinVoices([voice4]).format([voice4], staveWidth-100);

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


  const exportToPNG = async () => {
  const svg1 = vexRef.current?.querySelector('svg:nth-of-type(1)');
  const svg2 = vexRef.current?.querySelector('svg:nth-of-type(2)');
  if (!svg1 || !svg2) {
    console.error('SVG elements not found.');
    return;
  }

  const svgData1 = new XMLSerializer().serializeToString(svg1);
  const svgData2 = new XMLSerializer().serializeToString(svg2);
  
  const canvas = document.createElement('canvas');
  const svgSize1 = svg1.getBoundingClientRect();
  const svgSize2 = svg2.getBoundingClientRect();
  canvas.width = Math.max(svgSize1.width, svgSize2.width);
  canvas.height = svgSize1.height + svgSize2.height;
  const ctx = canvas.getContext('2d');
  
  const img1 = new Image();
  img1.src = `data:image/svg+xml;base64,${btoa(svgData1)}`;
  img1.onload = () => {
    ctx?.drawImage(img1, 0, 0);
    const img2 = new Image();
    img2.src = `data:image/svg+xml;base64,${btoa(svgData2)}`;
    img2.onload = async () => {
      ctx?.drawImage(img2, 0, svgSize1.height);
      const pngData = canvas.toDataURL('image/png');
      setImageURL(pngData);
      
      const blob = await fetch(pngData).then(res => res.blob());
      const file = new File([blob], 'sheet.png', { type: 'image/png' });
      const url = URL.createObjectURL(file);
      setDownloadURL(url);
      setIsDownloading(true);
    };
  };
};


  const playWAV = async () => {
    const synth = new Tone.Synth({
      volume: 10,
      oscillator: {
        type: wave === 'sine' ? 'sine' : 'square'
      }
    }).toDestination();
    const now = Tone.now();

    notes.forEach((note, index) => {
      if (note.note !== -1) {
        const noteName = toneMap[note.note];
        const time = index*(1-bpm*0.01);
        synth.triggerAttackRelease(noteName, '16n', now + time);
      }
    });


    await Tone.start();
    const recorder = new Tone.Recorder();
    synth.connect(recorder);
    recorder.start();

  };

  const handleWaveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setWave(event.target.value);
  };

  const handleBPMChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBPM(parseInt(event.target.value));
  }

  const handleCloseModal = () => {
    setIsDownloading(false);
  }


  return (
    <div className="p-4" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Timer remainingTime={remainingTime} />
      <div className="toolbar" style={{
        width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'
      }}>
        <div className="wave-selector" style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px' }}>Wave:</label>
          <select onChange={handleWaveChange} style={{ padding: '5px' }}>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
          </select>
        </div>
        <div className="bpm-slider" style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px' }}>BPM:</label>
          <input type="range" min="30" max="99" onChange={handleBPMChange} style={{ width: '200px' }} />
        </div>
      </div>
      <div className="mt-4" style={{ width: '90%', display: 'flex' }}>
        <div className="note-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(66, 1fr)', gap: '0' }}>
          {Array.from({ length: 16 }).map((_, row) =>
            Array.from({ length: 66 }).map((_, col) => {
              const isPianoKey = col < 2;
              const isBlackKey = ['c#/4', 'd#/4', 'f#/4', 'g#/4', 'a#/4', 'c#/5', 'd#/5'].includes(noteMap[row]);
              
              return (
                <div
                  key={`${row}-${col}`}
                  onClick={() => !isPianoKey && handleCellClick(row, col - 2)}
                  style={{
                    backgroundColor: isPianoKey ? (isBlackKey ? 'black' : 'white') : (notes.some(note => noteMap[note.note] === noteMap[row] && note.time === (col - 2)) ? 'black' : 'white'),
                    color: isPianoKey ? (isBlackKey ? 'white' : 'black') : 'black',
                    width: '100%',
                    paddingBottom: '100%',
                    position: 'relative',
                    border: isPianoKey ? 'none' : '1px solid gray',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid gray'
                  }}
                >
                  {isPianoKey ? null : col !== 2 && (col-2) % 16 === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '1px',
                        height: '100%',
                        backgroundColor: 'red',
                        left: 0,
                        top: 0
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="mt-4" style={{ width: '90%' }}>
        <div ref={vexRef} />
      </div>
      <div className="actions" style={{
        width: '90%', display: 'flex', justifyContent: 'space-evenly', marginTop: '10px', flexShrink: '0'
      }}>
        <button onClick={clearNotes} className="bg-red-500 text-white py-2 px-4 rounded mt-4">
          Clear
        </button>
        <button onClick={exportToPNG} className="bg-blue-500 text-white py-2 px-4 rounded mt-4">
          Export to PNG
        </button>
        <button onClick={playWAV} className="bg-blue-500 text-white py-2 px-4 rounded mt-4">
          Play WAV
        </button>
      </div>
      <NFTMintingModal isOpen={isDownloading} onClose={handleCloseModal} url={downloadURL}/>
    </div>
  );
};

export default MusicSheetPage;
