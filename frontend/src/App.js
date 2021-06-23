import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import {  PhoneDisabled } from '@material-ui/icons';
import {  Paper,Grid,Typography } from '@material-ui/core';
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import{ io } from "socket.io-client"
import "./App.css"


const socket = io.connect('http://localhost:5000')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState(null)
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream);
				myVideo.current.srcObject = stream;
		});

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("calluser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			
				userVideo.current.srcObject = stream
			
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
		window.location.reload();
	}

	return (
		<>	
			<h1 style={{ textAlign: "center", color: '#00008B' ,fontFamily:"Cambria" }}>Microsoft Teams</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream && (
						  <Grid item xs={12} md={6}>
							<Typography variant="h5" gutterBottom>Me</Typography>
							<video playsInline muted ref={myVideo} autoPlay style={{ width: "400px" }} />
						  </Grid>
					)};
				</div>
				<div className="video">
				<Grid item xs={12} md={6}>
				<Typography variant="h5" gutterBottom>{name || 'Recipient Name'}</Typography>
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:null}
				  </Grid>

				</div>
				</div>
			<div className="myId">
				<TextField
					id="filled-basic"
					label="Recipient Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
        {console.log(me)}
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
      
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(f) => setIdToCall(f.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color='secondary' startIcon={<PhoneDisabled fontSize="large" />} fullWidth onClick={leaveCall}>
							Hang Up
						</Button>
					) : (
						<IconButton variant="contained" color='primary' aria-label="call" fullWidth onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
							Call
						</IconButton>
					)}
					{idToCall}
				</div>
			</div>
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<Button variant="contained" color='primary' onClick={answerCall}>
							Answer {name} is calling
						</Button>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App
