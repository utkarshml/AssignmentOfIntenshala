
import './App.css'
import GetTable from './GetTable'
import  { data} from "./assets/MOCK_DATA"






function App() {

  return (
    <>
       <div  style={{
        overflowX: "auto"
      }}>
        <GetTable isPagination={true} data={data} pageSize={10}/>
      </div>
    </>
  )
}

export default App
