import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { CompareIcon } from '../components/Icons'
import { useAppState } from '../context/useAppState'
import { getVisualStyle } from '../lib/visuals'
import '../App.css'

function ComparePage() {
  const { allListings, comparisons } = useAppState()
  const compareItems = comparisons
    .map((id) => allListings.find((item) => item.id === id))
    .filter(Boolean)

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content page-content--compact">
        <section className="compare-page">
          <div className="section-bar">
            <span className="section-bar__icon">
              <CompareIcon />
            </span>
            <h1>Motor Karşılaştırma</h1>
          </div>

          <div className="compare-grid">
            {[0, 1].map((index) => {
              const item = compareItems[index]

              return (
                <article key={index} className="compare-slot">
                  {item ? (
                    <>
                      <div
                        className="compare-slot__visual"
                        style={getVisualStyle(item.visual)}
                      />
                      <h2>{item.title}</h2>
                      <p>{item.price}</p>
                      <span>{item.km} · {item.city}</span>
                    </>
                  ) : (
                    <>
                      <span className="compare-slot__ghost">
                        <CompareIcon />
                      </span>
                      <h2>Motor {index + 1}</h2>
                      <p>İlan sayfasından "Karşılaştır" butonuna tıklayarak buraya motor ekleyin.</p>
                      <Link className="primary-button" to="/">
                        İlanlara Gözat
                      </Link>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ComparePage
