import React, { FC, useCallback, useEffect, useState } from 'react';
import { DatePicker } from 'antd';
import './App.css';

const { RangePicker } = DatePicker;

interface MomentObj {
  valueOf: Function
}

const App: FC = () => {
  const [interval, setInterval] = useState<Number[]>()
  const onIntervalSelected = useCallback((selection) => {
    setInterval(selection.map((i: MomentObj) => i.valueOf()))
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!interval) return

    })()
  }, [interval])

  return (
    <div className="App">
      <RangePicker showTime onChange={onIntervalSelected}/>
    </div>
  )
};

export default App;