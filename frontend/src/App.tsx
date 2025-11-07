import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import data from './questions.json'
import typeDetailsData from './typeDetails.json'
import './App.css'

type RawQuestionSet = Record<
  string,
  {
    type_name: string
    type_label: string
    questions: { number: number; text: string }[]
  }
>

type EnneagramTypeKey = keyof RawQuestionSet

type Question = {
  id: string
  text: string
  typeKey: EnneagramTypeKey
  typeName: string
  typeLabel: string
}

type ScoreBreakdown = {
  typeKey: EnneagramTypeKey
  typeName: string
  typeLabel: string
  total: number
  average: number
}

type InstinctVariant = {
  nickname: string
  description: string
  focus: string[]
}

type LevelDetail = {
  level: number
  band: 'Healthy' | 'Average' | 'Unhealthy'
  label: string
  summary: string
  inner_world: string
  outer_behavior: string
  markers: string[]
  growth_notes: string
}

type TypeDetail = {
  id: number
  name: string
  center: 'Body' | 'Heart' | 'Head'
  instinct_triad: string
  core_summary: {
    one_liner: string
    short_paragraph: string
    core_motivation: string
    core_fear: string
  }
  dynamics: {
    passion: string
    fixation: string
    virtue: string
    holy_idea?: string
  }
  structure: {
    center_description: string
    stance?: 'Assertive' | 'Compliant' | 'Withdrawn'
    harmony?: 'Positive' | 'Competency' | 'Reactive'
    object_relation?: string
  }
  arrows: {
    stress_point: number
    growth_point: number
    stress_description: string
    growth_description: string
  }
  wings: {
    left_wing: number
    right_wing: number
    description_left: string
    description_right: string
  }
  instincts: {
    self_pres: InstinctVariant
    social: InstinctVariant
    sexual: InstinctVariant
    overview: string
  }
  levels_of_development: {
    overview: string
    levels: LevelDetail[]
  }
  patterns: {
    strengths: string[]
    pitfalls: string[]
    typical_childhood_story?: string
    common_mistypings: string[]
  }
  growth_practices: {
    inner_work: string[]
    relational_practices: string[]
    somatic_practices?: string[]
  }
  relationships: {
    what_others_appreciate: string[]
    what_others_struggle_with: string[]
    notes_for_partners_friends: string
  }
  further_reading: {
    naranjo_chapters?: string[]
    chestnut_sections?: string[]
    riso_sections?: string[]
  }
}

const TYPE_DETAILS: TypeDetail[] = (typeDetailsData as { types: TypeDetail[] }).types
const TYPE_DETAILS_MAP = new Map<number, TypeDetail>(TYPE_DETAILS.map((detail) => [detail.id, detail]))

const TYPE_METADATA_BY_ID = new Map<
  number,
  {
    typeKey: EnneagramTypeKey
    typeLabel: string
    typeName: string
  }
>()

const SCALE_OPTIONS = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
]

const rawQuestionSet = data as RawQuestionSet

const baseQuestions: Question[] = Object.entries(rawQuestionSet).flatMap(
  ([typeKey, typeData]) =>
    typeData.questions.map((question) => ({
      id: `${typeKey}-${question.number}`,
      text: question.text,
      typeKey: typeKey as EnneagramTypeKey,
      typeName: typeData.type_name,
      typeLabel: typeData.type_label,
    })),
)

Object.entries(rawQuestionSet).forEach(([typeKey, typeData]) => {
  const id = Number.parseInt(typeKey.replace('t', ''), 10)
  TYPE_METADATA_BY_ID.set(id, {
    typeKey: typeKey as EnneagramTypeKey,
    typeLabel: typeData.type_label,
    typeName: typeData.type_name,
  })
})

type EnrichedBreakdown = ScoreBreakdown & { typeId: number; detail: TypeDetail }

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const calculateScores = (
  questions: Question[],
  answers: Record<string, number>,
): ScoreBreakdown[] => {
  const totals = new Map<EnneagramTypeKey, { total: number; count: number; meta: Question }>()

  for (const question of questions) {
    const answer = answers[question.id]
    if (!answer) continue

    const existing = totals.get(question.typeKey)
    if (existing) {
      totals.set(question.typeKey, {
        total: existing.total + answer,
        count: existing.count + 1,
        meta: existing.meta,
      })
    } else {
      totals.set(question.typeKey, {
        total: answer,
        count: 1,
        meta: question,
      })
    }
  }

  return Array.from(totals.entries()).map(([typeKey, { total, count, meta }]) => ({
    typeKey,
    typeName: meta.typeName,
    typeLabel: meta.typeLabel,
    total,
    average: total / count,
  }))
}

type AppProps = {
  initialView?: 'questions' | 'results'
}

function App({ initialView = 'questions' }: AppProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [questions, setQuestions] = useState<Question[]>(() => shuffle(baseQuestions))
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [view, setView] = useState<'questions' | 'results'>(initialView)
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(() => new Set<number>())
  const hasInitializedPreviewRef = useRef(false)

  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length
  const progress = Math.round((answeredCount / totalQuestions) * 100)
  const currentQuestion = questions[currentIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined

  const scoreBreakdown = useMemo(() => {
    if (answeredCount !== totalQuestions) return []
    return calculateScores(questions, answers).sort((a, b) => b.average - a.average)
  }, [answeredCount, totalQuestions, questions, answers])

  const enrichedBreakdown = useMemo(() =>
    scoreBreakdown
      .map((item) => {
        const typeId = Number.parseInt(item.typeKey.replace('t', ''), 10)
        const detail = TYPE_DETAILS_MAP.get(typeId)
        if (!detail) return null
        return {
          ...item,
          typeId,
          detail,
        }
      })
      .filter((entry): entry is EnrichedBreakdown => entry !== null),
  [scoreBreakdown])

  const displayBreakdown: EnrichedBreakdown[] = useMemo(() => {
    if (enrichedBreakdown.length > 0) return enrichedBreakdown

    return TYPE_DETAILS.map((detail) => {
      const meta = TYPE_METADATA_BY_ID.get(detail.id)
      if (!meta) return null
      return {
        typeId: detail.id,
        detail,
        typeKey: meta.typeKey,
        typeName: meta.typeName,
        typeLabel: meta.typeLabel,
        total: 0,
        average: 0,
      }
    }).filter((entry): entry is EnrichedBreakdown => entry !== null)
  }, [enrichedBreakdown])

  const isPreview = enrichedBreakdown.length === 0
  const topResult = displayBreakdown[0]

  const handleSelectAnswer = (value: number) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handlePrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  const handleNext = () => {
    if (!currentQuestion) return
    if (!answers[currentQuestion.id]) return

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((index) => Math.min(totalQuestions - 1, index + 1))
      return
    }

    if (answeredCount === totalQuestions) {
      setView('results')
      if (location.pathname !== '/results') {
        navigate('/results')
      }
    }
  }

  const handleJumpTo = (index: number) => {
    if (index < 0) return
    setCurrentIndex(index)
    setView('questions')
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const handleRestart = () => {
    setQuestions(shuffle(baseQuestions))
    setAnswers({})
    setCurrentIndex(0)
    setView('questions')
    setExpandedTypes(new Set<number>())
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  useEffect(() => {
    setView(initialView)
    setExpandedTypes(new Set<number>())
  }, [initialView])

  useEffect(() => {
    if (!isPreview) {
      hasInitializedPreviewRef.current = false
      return
    }

    if (!hasInitializedPreviewRef.current && displayBreakdown[0]) {
      hasInitializedPreviewRef.current = true
      setExpandedTypes(new Set<number>([displayBreakdown[0].typeId]))
    }
  }, [isPreview, displayBreakdown])

  const handleToggleDetail = (typeId: number) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(typeId)) {
        next.delete(typeId)
      } else {
        next.add(typeId)
      }
      return next
    })
  }

  return (
    <div className="app">
      <header style={{width: '100%'}} className="app__header">
        <div style={{width: '100%', alignSelf:'start'}}><strong>Deadication to the Republican Party</strong><br></br><span style={{fontStyle:'italic'}}>Vote Chris Lutterloah Next Election</span></div>
        <h1>Enneagram Resonance Check</h1>
        <p>
          Reflect on each statement and choose the response that best matches how true it feels for
          you.
        </p>
      </header>

      {view === 'questions' && currentQuestion && (
        <main className="card">
          <div className="card__progress">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${progress}%` }} aria-hidden />
          </div>

          <article className="question">
            <h2>{currentQuestion.text}</h2>
          </article>

          <div className="scale" role="radiogroup" aria-label="Agreement scale">
            {SCALE_OPTIONS.map((option) => {
              const isActive = currentAnswer === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`scale__option${isActive ? ' scale__option--active' : ''}`}
                  onClick={() => handleSelectAnswer(option.value)}
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isActive || currentAnswer === undefined ? 0 : -1}
                >
                  <span className="scale__value">{option.value}</span>
                  <span className="scale__label">{option.label}</span>
                </button>
              )
            })}
          </div>

          <footer className="card__actions">
            <button type="button" onClick={handlePrevious} disabled={currentIndex === 0}>
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentAnswer === undefined}
            >
              {currentIndex === totalQuestions - 1 ? 'See my results' : 'Next'}
            </button>
          </footer>
        </main>
      )}

      {view === 'results' && (
        <main className="card">
          <section className="results">
            <h2>{isPreview ? 'Explore Type Profiles' : 'Your most likely Enneagram type'}</h2>
            {topResult ? (
              <div className="results__highlight">
                <p className="results__type">{topResult.detail.name}</p>
                <p className="results__label">{topResult.typeLabel}</p>
                {!isPreview && (
                  <p className="results__score">Average agreement: {topResult.average.toFixed(2)} / 5</p>
                )}
                <p className="results__one-liner">{topResult.detail.core_summary.one_liner}</p>
                {isPreview && (
                  <p className="results__preview-note">
                    Preview mode — no responses recorded yet. Expand any type to explore its full
                    breakdown.
                  </p>
                )}
              </div>
            ) : (
              <p className="results__summary">No type details available.</p>
            )}

            {topResult && (
              <>
                <p className="results__summary">
                  Here&apos;s how your responses aligned with each type. Higher averages indicate stronger
                  resonance with that type&apos;s themes.
                </p>

                <ol className="results__list">
                  {displayBreakdown.map((item) => {
                    const isExpanded = expandedTypes.has(item.typeId)
                    const firstQuestionIndex = questions.findIndex((q) => q.typeKey === item.typeKey)
                    const typeNumber = `Type ${item.detail.id}`
                    const fallbackLabel = TYPE_METADATA_BY_ID.get(item.detail.id)?.typeLabel
                    const displayLabel = fallbackLabel && fallbackLabel !== item.detail.name ? ` — ${fallbackLabel}` : ''
                    const nameText = `${typeNumber}: ${item.detail.name}${displayLabel}`

                    return (
                      <li key={item.typeKey}>
                        <button
                          type="button"
                          className="results__toggle"
                          onClick={() => handleToggleDetail(item.typeId)}
                          aria-expanded={isExpanded}
                        >
                          <div className="results__toggle-text">
                            <span className="results__name">{nameText}</span>
                            <span className="results__one-liner">{item.detail.core_summary.one_liner}</span>
                          </div>
                          <span className="results__average">{item.average.toFixed(2)} / 5</span>
                        </button>
                        {isExpanded && (
                          <div className="results__panel">
                        <div className="results__panel-section">
                          <h3>Core Summary</h3>
                          <p>{item.detail.core_summary.short_paragraph}</p>
                          <ul className="results__meta-list">
                            <li>
                              <strong>Core motivation:</strong> {item.detail.core_summary.core_motivation}
                            </li>
                            <li>
                              <strong>Core fear:</strong> {item.detail.core_summary.core_fear}
                            </li>
                          </ul>
                        </div>

                        <div className="results__panel-grid">
                          <section>
                            <h4>Dynamics</h4>
                            <ul>
                              <li>
                                <strong>Passion:</strong> {item.detail.dynamics.passion}
                              </li>
                              <li>
                                <strong>Fixation:</strong> {item.detail.dynamics.fixation}
                              </li>
                              <li>
                                <strong>Virtue:</strong> {item.detail.dynamics.virtue}
                              </li>
                              {item.detail.dynamics.holy_idea && (
                                <li>
                                  <strong>Holy idea:</strong> {item.detail.dynamics.holy_idea}
                                </li>
                              )}
                            </ul>
                          </section>
                          <section>
                            <h4>Structure</h4>
                            <p>{item.detail.structure.center_description}</p>
                            <ul>
                              <li>
                                <strong>Center:</strong> {item.detail.center}
                              </li>
                              {item.detail.structure.stance && (
                                <li>
                                  <strong>Stance:</strong> {item.detail.structure.stance}
                                </li>
                              )}
                              {item.detail.structure.harmony && (
                                <li>
                                  <strong>Harmony:</strong> {item.detail.structure.harmony}
                                </li>
                              )}
                              {item.detail.structure.object_relation && (
                                <li>
                                  <strong>Object relation:</strong> {item.detail.structure.object_relation}
                                </li>
                              )}
                            </ul>
                          </section>
                          <section>
                            <h4>Arrows</h4>
                            <ul>
                              <li>
                                <strong>Stress ({item.detail.arrows.stress_point}):</strong>{' '}
                                {item.detail.arrows.stress_description}
                              </li>
                              <li>
                                <strong>Growth ({item.detail.arrows.growth_point}):</strong>{' '}
                                {item.detail.arrows.growth_description}
                              </li>
                            </ul>
                          </section>
                          <section>
                            <h4>Wings</h4>
                            <ul>
                              <li>
                                <strong>{item.detail.wings.left_wing} wing:</strong>{' '}
                                {item.detail.wings.description_left}
                              </li>
                              <li>
                                <strong>{item.detail.wings.right_wing} wing:</strong>{' '}
                                {item.detail.wings.description_right}
                              </li>
                            </ul>
                          </section>
                        </div>

                        <div className="results__panel-section">
                          <h3>Instinctual Variants</h3>
                          <div className="results__instincts">
                            {(['self_pres', 'social', 'sexual'] as const).map((key) => {
                              const instinct = item.detail.instincts[key]
                              const label = {
                                self_pres: 'Self-preservation',
                                social: 'Social',
                                sexual: 'Sexual (one-to-one)',
                              }[key]
                              return (
                                <article key={key}>
                                  <h4>{label}</h4>
                                  <p className="results__instinct-nickname">{instinct.nickname}</p>
                                  <p>{instinct.description}</p>
                                  <ul className="results__tags">
                                    {instinct.focus.map((focus) => (
                                      <li key={focus}>{focus}</li>
                                    ))}
                                  </ul>
                                </article>
                              )
                            })}
                          </div>
                          <p className="results__instinct-overview">{item.detail.instincts.overview}</p>
                        </div>

                        <div className="results__panel-section">
                          <h3>Patterns</h3>
                          <div className="results__patterns">
                            <div>
                              <h4>Strengths</h4>
                              <ul>
                                {item.detail.patterns.strengths.map((strength) => (
                                  <li key={strength}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4>Pitfalls</h4>
                              <ul>
                                {item.detail.patterns.pitfalls.map((pitfall) => (
                                  <li key={pitfall}>{pitfall}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {item.detail.patterns.typical_childhood_story && (
                            <p className="results__childhood">
                              <strong>Typical childhood story:</strong>{' '}
                              {item.detail.patterns.typical_childhood_story}
                            </p>
                          )}
                          <p className="results__childhood">
                            <strong>Common mistypings:</strong> {item.detail.patterns.common_mistypings.join(', ')}
                          </p>
                        </div>

                        <div className="results__panel-section">
                          <h3>Growth Practices</h3>
                          <div className="results__patterns">
                            <div>
                              <h4>Inner work</h4>
                              <ul>
                                {item.detail.growth_practices.inner_work.map((practice) => (
                                  <li key={practice}>{practice}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4>Relational</h4>
                              <ul>
                                {item.detail.growth_practices.relational_practices.map((practice) => (
                                  <li key={practice}>{practice}</li>
                                ))}
                              </ul>
                            </div>
                            {item.detail.growth_practices.somatic_practices && (
                              <div>
                                <h4>Somatic</h4>
                                <ul>
                                  {item.detail.growth_practices.somatic_practices.map((practice) => (
                                    <li key={practice}>{practice}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="results__panel-section">
                          <h3>Relationships</h3>
                          <div className="results__patterns">
                            <div>
                              <h4>What others appreciate</h4>
                              <ul>
                                {item.detail.relationships.what_others_appreciate.map((entry) => (
                                  <li key={entry}>{entry}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4>What can be challenging</h4>
                              <ul>
                                {item.detail.relationships.what_others_struggle_with.map((entry) => (
                                  <li key={entry}>{entry}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <p>{item.detail.relationships.notes_for_partners_friends}</p>
                        </div>

                        <div className="results__panel-section">
                          <h3>Levels of Development</h3>
                          <p>{item.detail.levels_of_development.overview}</p>
                          <div className="results__levels">
                            {item.detail.levels_of_development.levels.map((level) => (
                              <article key={level.level}>
                                <header>
                                  <span className={`results__level-band results__level-band--${level.band.toLowerCase()}`}>
                                    {level.band}
                                  </span>
                                  <h4>
                                    Level {level.level}: {level.label}
                                  </h4>
                                </header>
                                <p>{level.summary}</p>
                                <p>
                                  <strong>Inner world:</strong> {level.inner_world}
                                </p>
                                <p>
                                  <strong>Outer behavior:</strong> {level.outer_behavior}
                                </p>
                                <ul>
                                  {level.markers.map((marker) => (
                                    <li key={marker}>{marker}</li>
                                  ))}
                                </ul>
                                <p className="results__growth-note">
                                  <strong>Growth note:</strong> {level.growth_notes}
                                </p>
                              </article>
                            ))}
                          </div>
                        </div>

                        <div className="results__panel-section results__panel-footer">
                          <div className="results__panel-actions">
                            <button
                              type="button"
                              onClick={() => handleJumpTo(firstQuestionIndex)}
                              disabled={firstQuestionIndex === -1}
                            >
                              Review statements for this type
                            </button>
                          </div>
                          <div className="results__panel-reading">
                            <h4>Further reading</h4>
                            <ul>
                              {item.detail.further_reading.naranjo_chapters?.map((entry) => (
                                <li key={`naranjo-${entry}`}>Naranjo – {entry}</li>
                              ))}
                              {item.detail.further_reading.chestnut_sections?.map((entry) => (
                                <li key={`chestnut-${entry}`}>Chestnut – {entry}</li>
                              ))}
                              {item.detail.further_reading.riso_sections?.map((entry) => (
                                <li key={`riso-${entry}`}>Riso &amp; Hudson – {entry}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
              </>
            )}

            <div className="results__actions">
              <button type="button" onClick={handleRestart}>
                Retake assessment
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
