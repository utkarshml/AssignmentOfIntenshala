
import './App.css'
import GetTable from './GetTable'
import  { data} from "./assets/MOCK_DATA"




const modifiedData = data.map(item => {
  return {
    ...item,
    id: String(item.id) // Convert the ID number to a string
  };
});
export type modifiedDataType = (typeof modifiedData)[number]
function App() {


  return (
    <>
       <div  style={{
        overflowX: "auto"
      }}>
        <GetTable isPagination={true} data={modifiedData} pageSize={10}/>
      </div>
    </>
  )
}

export default App
