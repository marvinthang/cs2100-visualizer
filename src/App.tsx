function App() {
  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold text-blue-600">
        CS2100 MIPS Visualizer
      </h1>
      <p className="mt-4 text-gray-700">
        Welcome, Marvin. Ready to build the datapath?
      </p>
      
      <div className="mt-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        {/* We will build the MIPS circuit here */}
        <p className="text-center text-gray-400">Datapath Placeholder</p>
      </div>
    </div>
  )
}

export default App