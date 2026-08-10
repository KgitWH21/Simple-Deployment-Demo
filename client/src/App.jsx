import { useState } from 'react'
import { Outlet, useLoaderData } from 'react-router-dom'
import './App.css'

function App() {
  const [user, setUser] = useState(useLoaderData())

  // const test_connection = async()=>{
  //   let response = await api.get("test/")
  //   console.log(response)
  // }

  // useEffect(()=>{
  //   test_connection()
  // }, [])



  return (
    <>
     <Outlet context={{ user, setUser }}/>
    </>
  )
}

export default App