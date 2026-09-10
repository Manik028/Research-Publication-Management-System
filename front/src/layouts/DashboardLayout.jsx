import Sidebar from '../components/sidebar/Sidebar'


function DashboardLayout({ children }) {

  return (

    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">


      {/* =========================================
          SIDEBAR
      ========================================= */}

      <Sidebar />


      {/* =========================================
          MAIN APPLICATION AREA
      ========================================= */}

      <main className="min-h-screen transition-all duration-300 lg:ml-72">

        <div className="mx-auto max-w-7xl p-5 pt-20 lg:p-8">

          {children}

        </div>

      </main>


    </div>

  )
}


export default DashboardLayout