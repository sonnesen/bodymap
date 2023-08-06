import './App.css';
import React, { useState } from 'react';

const Web3 = require('web3');
window.ethereum.request({ method: 'eth_requestAccounts' });
const web3 = new Web3(window.ethereum);
const fetch = require('node-fetch');
const crypto = require('crypto-js');

function App() {
  const [passwordClearText, setPasswordClearText] = useState("");
  const [passwordClearTextBasic, setPasswordClearTextBasic] = useState("");
  const [passwordClearTextTailor, setPasswordClearTextTailor] = useState("");
  const [deployedContract, setDeployedContract] = useState("");
  const [deployedContractAddress, setDeployedContractAddress] = useState("");

  const handlePasswordClearTextChange = (event) => {
    setPasswordClearText(event.target.value);
  }

  const handlePasswordClearTextBasicChange = (event) => {
    setPasswordClearTextBasic(event.target.value);
  }

  const handlePasswordClearTextTailorChange = (event) => {
    setPasswordClearTextTailor(event.target.value);
  }

  const [bodyMapBasic, setBodyMapBasic] = useState({
    height: '', weight: ''
  });

  const [bodyMapTailor, setBodyMapTailor] = useState({
    waist: '', legs: '', arms: '', posture: ''
  });

  const handleBodyMapBasicChange = (event, key) => {
    setBodyMapBasic({ ...bodyMapBasic, [key]: event.target.value });
  }

  const handleBodyMapTailorChange = (event, key) => {
    setBodyMapTailor({ ...bodyMapTailor, [key]: event.target.value });
  }

  async function deployContract() {
    fetch('http://localhost:8000')
      .then(response => response.json())
      .then(async (compiledContract) => {
        const accounts = await web3.eth.getAccounts();
        const deployedContract = await new web3.eth.Contract(compiledContract.abi)
          .deploy({ data: compiledContract.evm.bytecode.object, arguments: [passwordClearText] })
          .send({ from: accounts[0], gas: '1000000' });
        setDeployedContract(deployedContract);
        setDeployedContractAddress(deployedContract.options.address);
      });
  }

  async function updateBodyMaps() {
    const accounts = await web3.eth.getAccounts();
    let bodyMapBasicString = JSON.stringify(bodyMapBasic);
    let bodyMapTailorString = JSON.stringify(bodyMapTailor);
    const encryptedBodyMapBasic = crypto.AES.encrypt(bodyMapBasicString, passwordClearTextBasic).toString();
    const encryptedBodyMapTailor = crypto.AES.encrypt(bodyMapTailorString, passwordClearTextTailor).toString();
    await deployedContract.methods
      .setBodyMaps(passwordClearText, encryptedBodyMapBasic, encryptedBodyMapTailor)
      .send({ from: accounts[0], gas: '5000000' });
  }

  async function loadBodyMaps() {
    let newBodyMapBasicEncrypted = await deployedContract.methods.basicBodyMap().call();
    let newBodyMapTailorEncrypted = await deployedContract.methods.tailorBodyMap().call();

    let bodyMapBasicBytes = crypto.AES.decrypt(newBodyMapBasicEncrypted, passwordClearTextBasic);
    let bodyMapTailorBytes = crypto.AES.decrypt(newBodyMapTailorEncrypted, passwordClearTextTailor);

    setBodyMapBasic(JSON.parse(bodyMapBasicBytes.toString(crypto.enc.Utf8)));
    setBodyMapTailor(JSON.parse(bodyMapTailorBytes.toString(crypto.enc.Utf8)));
  }

  return (
    <div className="App">
      <h1>Globomantics Body map</h1>
      <h3>Contract address: {deployedContractAddress}</h3>
      <div>
        <label>Contract password</label>
        <input type="text" value={passwordClearText} onChange={handlePasswordClearTextChange} />
        <button onClick={deployContract}>Deploy contract</button>
      </div>
      <div>
        <label>Basic password</label>
        <input type="text" value={passwordClearTextBasic} onChange={handlePasswordClearTextBasicChange} />
      </div>
      <div>
        <label>Tailor password</label>
        <input type="text" value={passwordClearTextTailor} onChange={handlePasswordClearTextTailorChange} />
      </div>
      <h3>Basic Body Map</h3>
      {
        Object.keys(bodyMapBasic).map((key) => (
          <div key={key}>
            <label>{key}</label>
            <input type="text" value={bodyMapBasic[key]}
              onChange={(event) => handleBodyMapBasicChange(event, key)} />
          </div>
        ))
      }
      <h3>Tailor Body Map</h3>
      {
        Object.keys(bodyMapTailor).map((key) => (
          <div key={key}>
            <label>{key}</label>
            <input type="text" value={bodyMapTailor[key]}
              onChange={(event) => handleBodyMapTailorChange(event, key)} />
          </div>
        ))
      }
      <br />
      <button onClick={updateBodyMaps}>Update body maps</button>
      <br />
      <button onClick={loadBodyMaps}>Load body maps</button>
    </div>
  );
}

export default App;
