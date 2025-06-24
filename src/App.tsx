import React, { useState } from 'react';
import './App.css';
import FtServices from './services/token/ft';
import Web3 from './web3';

type userPK =  {
    ena: null,
    pkOwn: null,
    pkEnc: null,
}

function App() {
  const [zktransfer, setZktransfer] = useState({
    senderEoa: '',
    senderEoaSk: '',
    senderEnaPk: undefined,
    senderEnaSk: '',
    reveiverEoa: '',
    amount: '',
  });

  const [zkDeposit, setZkDeposit] = useState({
    eoa: '',
    eoaSk: '',
    enaPk: undefined,
    enaSk: '',
    amount: '',
  });

  const [enaRegister, setEnaRegister] = useState({
    eoa: '',
    eoaSk: '',
    enaPk: undefined,
  });

  const tokenInfo = {
    name: 'Ethereum',
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    imageUri: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    decimal: '0'
  };

  const onChangeZkTransfer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setZktransfer(prev => {
      return {...prev, [name] : value}
    });
  };

  const onChangeZkDeposit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setZkDeposit(prev => {
      return {...prev, [name] : value}
    });
  };

  const onChangeEnaRegister = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEnaRegister(prev => {
      return {...prev, [name] : value}
    });
  };

  const registerENA = async() => {
    const azerothWeb3 = Web3.Azeroth.azerothContract;
    await azerothWeb3.registerUser(
                enaRegister.enaPk,
                enaRegister.eoa,
                enaRegister.eoaSk);
  }

  const deposit = () => {
    FtServices.exchangeToken(
        tokenInfo.address,
        'Charge',
        zkDeposit.amount,
        new Web3.Azeroth.structure.Key.UserKey(
            zkDeposit.enaPk,
            zkDeposit.enaSk,
        ),
        zkDeposit.eoa,
        zkDeposit.eoaSk,
    )
  }

  return (
    <div className="App">
      <div>
        <h2>private 전송</h2>
        <h5>sender eoa</h5>
        <input name='senderEoa' value={zktransfer.senderEoa} onChange={onChangeZkTransfer}/>
        <h5>sender eoa sk</h5>
        <input name='senderEoaSk' value={zktransfer.senderEoaSk} onChange={onChangeZkTransfer}/>
        <h5>sender ena pk</h5>
        <input name='senderEnaPk' value={zktransfer.senderEnaPk} onChange={onChangeZkTransfer}/>
        <h5>sender ena sk</h5>
        <input name='senderEnaSk' value={zktransfer.senderEnaSk} onChange={onChangeZkTransfer}/>
        <h5>receiver eoa</h5>
        <input name='reveiverEoa' value={zktransfer.reveiverEoa} onChange={onChangeZkTransfer}/>
        <h5>amount</h5>
        <input name='amount' value={zktransfer.amount} onChange={onChangeZkTransfer}/>
        <br/>
        <button>전송</button>
      </div>

      <div>
        <h2>public to private 전환</h2>
        <h5>eoa</h5>
        <input name='eoa' value={zkDeposit.eoa} onChange={onChangeZkDeposit}/>
        <h5>eoa sk</h5>
        <input name='eoaSk' value={zkDeposit.eoaSk} onChange={onChangeZkDeposit}/>
        <h5>ena pk</h5>
        <input name='enaPk' value={zkDeposit.enaPk} onChange={onChangeZkDeposit}/>
        <h5>ena sk</h5>
        <input name='enaSk' value={zkDeposit.enaSk} onChange={onChangeZkDeposit}/>
        <h5>amount</h5>
        <input name='amount' value={zkDeposit.amount} onChange={onChangeZkDeposit}/>
        <br/>
        <button>전송</button>
      </div>

      <div>
        <h2>ena 등록</h2>
        <h5>eoa</h5>
        <input name='eoa' value={enaRegister.eoa} onChange={onChangeEnaRegister}/>
        <h5>eoa sk</h5>
        <input name='eoaSk' value={enaRegister.eoaSk} onChange={onChangeEnaRegister}/>
        <h5>ena pk</h5>
        <input name='enaPk' value={enaRegister.enaPk} onChange={onChangeEnaRegister}/>
        <br/>
        <button>전송</button>
      </div>
    </div>
  );
}

export default App;
