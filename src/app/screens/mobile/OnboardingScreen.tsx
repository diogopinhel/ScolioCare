import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useNavigate } from 'react-router';

const slides = [
  {
    id: 1,
    title: 'Acompanhe a sua escoliose',
    subtitle: 'Monitorize o seu progresso com gráficos e métricas detalhados de evolução ao longo do tempo',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BpbmUlMjBjaGFydCUyMGRpYWdyYW18ZW58MXx8fHwxNzc1NjY1NjMwfDA&ixlib=rb-4.1.0&q=80&w=400',
    backgroundColor: 'var(--scolio-light-blue-surface)'
  },
  {
    id: 2,
    title: 'Aceda aos seus exames',
    subtitle: 'Consulte todos os seus exames e relatórios num único local, acessível a qualquer momento',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdW1lbnQlMjBmb2xkZXJ8ZW58MXx8fHwxNzc1NjY1NjMwfDA&ixlib=rb-4.1.0&q=80&w=400',
    backgroundColor: 'var(--scolio-success-surface)'
  },
  {
    id: 3,
    title: 'Comunique com o seu médico',
    subtitle: 'Partilhe os seus dados de bem-estar e receba orientação personalizada com o assistente de IA',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwY29uc3VsdGF0aW9ufGVufDF8fHx8MTc3NTY2NTYzMHww&ixlib=rb-4.1.0&q=80&w=400',
    backgroundColor: 'var(--scolio-warning-surface)'
  }
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/mobile/login');
    }
  };

  const handleSkip = () => {
    navigate('/mobile/login');
  };

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-white flex flex-col">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Skip Button */}
      <div className="px-6 py-4 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-[var(--scolio-primary-blue)] font-medium"
          style={{ fontSize: 'var(--text-body)' }}
        >
          Saltar
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Illustration */}
        <div className="mb-12">
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-60 h-60 object-cover rounded-lg"
          />
        </div>

        {/* Title */}
        <h2 className="text-[var(--scolio-text-primary)] text-center mb-4 px-4">
          {slides[currentSlide].title}
        </h2>

        {/* Subtitle */}
        <p
          className="text-[var(--scolio-text-secondary)] text-center max-w-[300px] mb-12"
          style={{ fontSize: 'var(--text-body)', lineHeight: '1.6' }}
        >
          {slides[currentSlide].subtitle}
        </p>

        {/* Dot Pagination */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-[var(--scolio-primary-blue)]'
                  : 'w-2 bg-[var(--scolio-border-light)]'
              }`}
            />
          ))}
        </div>

        {/* Next/Get Started Button */}
        <div className="w-full max-w-[342px]">
          <Button variant="primary" className="w-full" onClick={handleNext}>
            {currentSlide === slides.length - 1 ? 'Começar' : 'Seguinte'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}