import React, { useState } from 'react';
import './App.css';

function App() {
  const [zktransfer, setZktransfer] = useState({
    senderEoa: '',
    senderEoaSk: '',
    senderEnaPk: '',
    senderEnaSk: '',
    reveiverEoa: '',
    amount: '',
  });

  const [zkDeposit, setZkDeposit] = useState({
    eoa: '',
    eoaSk: '',
    enaPk: '',
    enaSk: '',
    amount: '',
  });

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
    </div>
  );
}

export default App;
