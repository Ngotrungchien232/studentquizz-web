import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import QuizCard from '../components/QuizCard/QuizCard';
import { quizService } from '../services/quizService';
import type { Quiz } from '../types';
import './ExplorePage.css';

const CATEGORIES = ['Tất cả', 'Lịch sử', 'Hóa học', 'Ngoại ngữ', 'Toán học', 'Sinh học', 'Vật lý'];

const ExplorePage = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filtered, setFiltered] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  useEffect(() => {
    quizService.getAll().then(({ content }) => {
      setQuizzes(content);
      setFiltered(content);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = quizzes;
    if (activeCategory !== 'Tất cả') {
      result = result.filter((q) => q.category === activeCategory);
    }
    if (search.trim()) {
      result = result.filter((q) =>
        q.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, activeCategory, quizzes]);

  return (
    <main className="explore-page">
      <div className="container">
        {/* Header */}
        <div className="explore-header">
          <h1 className="explore-title">Khám phá Quiz</h1>
          <p className="explore-subtitle">Tìm bài quiz phù hợp với bạn</p>
        </div>

        {/* Search & Filter */}
        <div className="explore-controls">
          <div className="explore-search">
            <Search size={18} className="explore-search__icon" />
            <input
              id="explore-search-input"
              type="text"
              placeholder="Tìm kiếm quiz..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="explore-search__input"
            />
          </div>

          <div className="explore-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`cat-${cat}`}
                className={`explore-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="explore-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="quiz-skeleton" style={{ height: 280 }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="explore-grid">
            {filtered.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        ) : (
          <div className="explore-empty">
            <Filter size={48} opacity={0.3} />
            <p>Không tìm thấy quiz nào</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default ExplorePage;
