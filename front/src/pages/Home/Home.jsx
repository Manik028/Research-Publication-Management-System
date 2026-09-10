import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  BookOpen,
  Upload,
  Users,
  Sparkles,
  FileText,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'


function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/publications?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/publications')
    }
  }

  return (
    <main className="min-h-screen bg-base-200">

      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="relative overflow-hidden">

        {/* Background glow */}
        <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />


        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">


          {/* =========================
              LEFT CONTENT
          ========================== */}
          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">

              <Sparkles size={16} />

              Research & Publication Management

            </div>


            <h2 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">

              Discover, Submit &

              <span className="block text-primary">
                Manage Academic
              </span>

              Research

            </h2>


            <p className="mt-7 max-w-2xl text-base leading-7 text-base-content/65 md:text-lg">

              A centralized platform for researchers to discover
              publications, submit research, collaborate with
              co-authors and participate in peer review.

            </p>


            {/* Search */}
            <form onSubmit={handleSearch} className="mt-8 max-w-2xl">

              <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl shadow-base-content/5 sm:flex-row">

                <div className="flex flex-1 items-center gap-3 px-3">

                  <Search
                    size={20}
                    className="shrink-0 text-base-content/40"
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, author, keyword or DOI"
                    className="input w-full border-0 bg-transparent px-0 outline-none focus:outline-none"
                  />

                </div>


                <button type="submit" className="btn btn-primary rounded-xl px-7">

                  Search

                  <ArrowRight size={17} />

                </button>

              </div>

            </form>


            {/* Feature highlights */}
            <div className="mt-8 flex flex-wrap gap-3">

              <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-4 py-2 text-sm">

                <BookOpen
                  size={16}
                  className="text-primary"
                />

                Discover Research

              </div>


              <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-4 py-2 text-sm">

                <Upload
                  size={16}
                  className="text-primary"
                />

                Submit Publications

              </div>


              <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-4 py-2 text-sm">

                <Users
                  size={16}
                  className="text-primary"
                />

                Collaborate

              </div>

            </div>

          </div>


          {/* =========================
              RIGHT VISUAL WINDOW
          ========================== */}
          <div className="relative hidden lg:block">

            {/* Outer glow */}
            <div className="absolute inset-10 rounded-[2rem] bg-primary/20 blur-3xl" />


            {/* Application preview */}
            <div className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-2xl">


              {/* Fake browser header */}
              <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">

                <div className="flex items-center gap-2">

                  <span className="h-3 w-3 rounded-full bg-error/70" />
                  <span className="h-3 w-3 rounded-full bg-warning/70" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />

                </div>

                <span className="text-xs text-base-content/40">
                  rpms
                </span>

                <div className="w-12" />

              </div>


              {/* Preview content */}
              <div className="p-6">


                <div className="mb-6 flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-base-content/50">
                      RESEARCH WORKSPACE
                    </p>

                    <h3 className="mt-1 text-xl font-bold">
                      Your Research Journey
                    </h3>

                  </div>


                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Sparkles size={20} />
                  </div>

                </div>


                {/* Highlight card */}
                <div className="rounded-2xl bg-primary p-5 text-primary-content">

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-sm font-medium opacity-80">
                        Explore
                      </p>

                      <h4 className="mt-1 text-2xl font-bold">
                        Academic Research
                      </h4>

                    </div>

                    <BookOpen size={24} />

                  </div>


                  <p className="mt-4 text-sm leading-6 opacity-80">
                    Discover publications, researchers,
                    journals and conferences from one
                    centralized platform.
                  </p>


                  <button 
                    onClick={() => navigate('/publications')}
                    className="mt-5 flex items-center gap-2 rounded-lg bg-primary-content/15 px-4 py-2 text-sm font-semibold transition hover:bg-primary-content/25"
                  >

                    Explore

                    <ChevronRight size={16} />

                  </button>

                </div>


                {/* Feature cards */}
                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl border border-base-300 bg-base-200 p-4">

                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-base-100 text-primary">

                      <FileText size={18} />

                    </div>

                    <p className="font-semibold">
                      Submit
                    </p>

                    <p className="mt-1 text-xs text-base-content/50">
                      Manage your research submissions
                    </p>

                  </div>


                  <div className="rounded-2xl border border-base-300 bg-base-200 p-4">

                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-base-100 text-primary">

                      <CheckCircle2 size={18} />

                    </div>

                    <p className="font-semibold">
                      Peer Review
                    </p>

                    <p className="mt-1 text-xs text-base-content/50">
                      Participate in research review
                    </p>

                  </div>

                </div>


                {/* Bottom status */}
                <div className="mt-5 flex items-center justify-between rounded-xl border border-base-300 px-4 py-3">

                  <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-success" />

                    <span className="text-xs text-base-content/60">
                      Research platform
                    </span>

                  </div>

                  <span className="text-xs font-medium text-base-content/50">
                    RPMS
                  </span>

                </div>

              </div>

            </div>


            {/* Floating card */}
            <div className="absolute -bottom-6 -left-8 hidden w-52 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl xl:block">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">

                  <CheckCircle2 size={20} />

                </div>

                <div>

                  <p className="text-sm font-semibold">
                    Research workflow
                  </p>

                  <p className="text-xs text-base-content/50">
                    Discover → Submit → Review
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          SIMPLE BOTTOM SECTION
      ========================== */}
      <section className="border-t border-base-300 bg-base-100">

        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:grid-cols-3 lg:px-8">

          <div className="flex gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">

              <BookOpen size={20} />

            </div>

            <div>

              <h3 className="font-semibold">
                Discover
              </h3>

              <p className="mt-1 text-sm leading-6 text-base-content/55">
                Explore academic publications and research.
              </p>

            </div>

          </div>


          <div className="flex gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">

              <Upload size={20} />

            </div>

            <div>

              <h3 className="font-semibold">
                Submit
              </h3>

              <p className="mt-1 text-sm leading-6 text-base-content/55">
                Submit and manage your research publications.
              </p>

            </div>

          </div>


          <div className="flex gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">

              <Users size={20} />

            </div>

            <div>

              <h3 className="font-semibold">
                Collaborate
              </h3>

              <p className="mt-1 text-sm leading-6 text-base-content/55">
                Work with researchers and co-authors.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================== */}
      <footer className="border-t border-base-300 bg-base-100">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-base-content/50 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <p>
            © 2026 RPMS — Research & Publication Management System
          </p>

          <p>
            Research • Publications • Collaboration
          </p>

        </div>

      </footer>

    </main>
  )
}

export default Home