import { useEffect, useState, useRef } from 'react';
import { Draggable } from "react-beautiful-dnd";

const AudioElem = ({ index, audios, id, setAudios, deleteAudio }) => {
    const audio = audios[id];
    const [type, setType] = useState(audio.type);
    const [duration, setDuration] = useState(audio.duration);
    const [audioPath, setAudioPath] = useState(audio.path);
    const [file, setFile] = useState(audio.file);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audio_context, setAudioContext] = useState(new AudioContext);
    const [recorder, setRecorder] = useState(null);
    const [isReadyToPlay, setIsReadyToPlay] = useState(false);
    //const [reader, setReader] = useState(new FileReader());
    const audioReader = useRef();
    //useEffect for reader to preview fileinput
    useEffect(async () => {
        switch (type) {
            case "silence":
                setDuration(duration || 10);
                break;
            case "standard":
                setAudioPath(audioPath || '/audios/bip.mp3');
                break;
            case "import":
                setFile(null);
                break;
            case "record":
                try {
                    // webkit shim
                    window.AudioContext = window.AudioContext || window.webkitAudioContext;
                    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
                    window.URL = window.URL || window.webkitURL;

                    //setAudioContext();
                    console.log('Audio context set up.');
                    console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
                } catch (e) {
                    alert('No web audio support in this browser!');
                }

                navigator.getUserMedia({ audio: true }, startUserMedia, function (e) {
                    console.log('No live audio input: ' + e);
                });

                setAudioPath(null);
                break;
        }
    }, [type])

    useEffect(() => {
        var newAudio = { 'name': id, duration, type, file, path: audioPath, id: id }
        setAudios({ ...audios, [id]: newAudio });
    }, [audioPath, duration, file, type])

    useEffect(() => {
        if (type == "import" && file != null) {
            var reader = new FileReader();
            reader.onload = function (e) {
                setAudioPath(e.target.result);
            }
            reader.readAsDataURL(file);
        }
    }, [file])

    useEffect(() => {
        if (audioReader.current) {
            audioReader.current.pause();
            setIsReadyToPlay(false);
            audioReader.current.load();

        }
    }, [audioPath])

    useEffect(() => {
        if (isRecording) {
            console.log("isrecording");
            recorder && recorder.record();
        }
        else {
            console.log("notRecording");
            recorder && recorder.stop();
            recorder && recorder.exportWAV(async function (blob) {
                console.log(blob);
                var url = URL.createObjectURL(blob);
                console.log(url);
                setAudioPath(url);
                recorder && recorder.clear();
            });
        }
    }, [isRecording])

    const grid = 8;

    const getItemStyle = (isDragging, draggableStyle) => {
        const { transform } = draggableStyle;
        let activeTransform = {};
        if (transform) {
            activeTransform = {
                transform: `translate(0, ${transform.substring(
                    transform.indexOf(',') + 1,
                    transform.indexOf(')')
                )})`
            };
        }
        return {
            // some basic styles to make the items look a bit nicer

            // change background colour if dragging
            background: isDragging ? 'lightgreen' : 'white',

            // styles we need to apply on draggables

            ...draggableStyle,
            ...activeTransform
        };
    };

    function HandleChangeAudioType(event) {
        setType(event.target.value);
    }
    function handleFileSelected(event) {
        setFile(event.target.files[0]);
    }
    function handleStandardFileSelected(event) {
        setAudioPath(event.target.value);
    }
    function handleSilenceLength(event) {
        if (duration > 0) {
            setDuration(event.target.value);
        }
    }
    function pause() {
        if (audioReader.current) {
            audioReader.current.pause();
            setIsPlaying(!isPlaying);
        }
    }
    function play() {
        if (audioReader.current) {
            audioReader.current.play();
            setIsPlaying(!isPlaying);
        }
    }
    function stop() {
        if (audioReader.current) {
            audioReader.current.pause();
            audioReader.current.currentTime = 0;
            setIsPlaying(!isPlaying);
        }
    }
    function record() {
        setIsRecording(!isRecording);
    }

    function startUserMedia(stream) {
        var input = audio_context.createMediaStreamSource(stream);
        console.log('Media stream created.');

        // Uncomment if you want the audio to feedback directly
        //input.connect(audio_context.destination);
        //__log('Input connected to audio context destination.');

        setRecorder(new Recorder(input));
        console.log('Recorder initialised.');
    }
    return (
        <Draggable draggableId={`draggable-${id}`} index={index}>
            {(provided, snapshot) => {
                return (
                    <div id={`draggable-${id}`} className="level box mb-1"
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                        )}>
                        <div className="level-left">
                            <div className="field has-addons level-item">
                                <div className="control">
                                    <div className="select">
                                        <select onChange={HandleChangeAudioType} value={type}>
                                            <option value="silence">Silence</option>
                                            <option value="import">Importer un fichier audio</option>
                                            <option value="record">Enregistrer audio</option>
                                            <option value="standard">Choisir un son</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="control">
                                    {type == "import" && <input type="file" className="input" onChange={handleFileSelected} />}
                                    {type == "silence" && (<div><input type="number" style={{ width: '150px' }} className="input" value={duration} onChange={handleSilenceLength} />
                                        <span style={{ display: "inline-flex", alignItems: "center", height: "40px" }}>secondes</span>
                                    </div>)}
                                    {type == "standard" && (
                                        <div className="select">
                                            <select value={audioPath || '/audios/delfInstruction.mp3'} onChange={handleStandardFileSelected} >
                                                <option value="/audios/bip.mp3">bip</option>
                                                <option value="/audios/delfInstruction.mp3">Instruction delf</option>
                                                <option value="/audios/fin.mp3">fin de l'épreuve</option>
                                            </select>
                                        </div>
                                    )}
                                    {type == "record" && (
                                        <button onClick={record} style={{ color: isRecording ? 'red' : 'black' }} className="button">
                                            <span className="icon">
                                                <i className="fas fa-microphone"></i>
                                            </span>
                                        </button>
                                    )}
                                </div>


                            </div>
                        </div>
                        <div className="level-right">
                            <div className="control level-item">
                                {(type != "silence" && audioPath != null) && (
                                    isPlaying ? (<>
                                        <button onClick={pause} className="button">
                                            <span className="icon">
                                                <i className="fas fa-pause"></i>
                                            </span>
                                        </button>
                                        <button onClick={stop} className="button">
                                            <span className="icon">
                                                <i className="fas fa-stop"></i>
                                            </span>
                                        </button></>
                                    ) : (
                                        <button className="button" onClick={play}>
                                            <span className="icon">
                                                <i className="fas fa-play"></i>
                                            </span>
                                        </button>
                                    )
                                )
                                }
                                <audio controls onCanPlayThrough={() => { setIsReadyToPlay(true); }} style={{ display: "none" }} ref={audioReader} onEnded={stop}><source src={audioPath}></source></audio>
                                {/* {isReadyToPlay ? "ready" : "Not yet"} */}
                            </div>
                            <div className="control level-item ml-3">
                                <button className="button is-danger" onClick={() => { deleteAudio(id) }}><span className="icon"><i className="fas fa-trash"></i></span></button>
                            </div>
                        </div>
                    </div>)
            }}
        </Draggable>
    )
}

export default AudioElem