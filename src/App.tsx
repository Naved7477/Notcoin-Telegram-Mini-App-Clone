import { useEffect, useState } from 'react';
import './index.css';
import Arrow from './icons/Arrow';
import { bear, coin, highVoltage, notcoin, rocket, trophy } from './images';

const showUnityAd = () => {
  if ((window as any).unityAds) {
    (window as any).unityAds.show('BP_Rewarded_Android');
  } else {
    const script = document.createElement('script');
    script.src = 'https://jsdelivr.net';
    script.onload = () => {
      (window as any).unityAds.initialize('800380130', false);
      setTimeout(() => (window as any).unityAds.show('BP_Rewarded_Android'), 1000);
    };
    document.body.appendChild(script);
  }
};

const App = () => {
  const [points, setPoints] = useState(0);
  const [energy, setEnergy] = useState(2532);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  const pointsToAdd = 12;
  const energyToReduce = 12;

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (energy - energyToReduce < 0) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPoints(points + pointsToAdd);
    setEnergy(energy - energyToReduce < 0 ? 0 : energy - energyToReduce);
    setClicks([...clicks, { id: Date.now(), x, y }]);
  };

  const handleAnimationEnd = (id: number) => {
    setClicks((prevClicks) => prevClicks.filter(click => click.id !== id));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prevEnergy) => Math.min(prevEnergy + 1, 6500));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-main min-h-screen px-4 flex flex-col items-center text-white font-medium select-none">
      <div className="absolute inset-0 h-1/2 bg-gradient-to-b from-[#bf953f] via-[#fcf6ba] to-transparent opacity-10 pointer-events-none z-0"></div>

      <div className="w-full z-10 flex flex-col items-center flex-grow justify-between pb-8">
        <div className="w-full flex flex-col items-center pt-8">
          <div className="w-full flex justify-between items-center px-4">
            <div className="flex items-center gap-2 bg-[#ffffff10] px-3 py-1.5 rounded-full border border-[#ffffff10]">
              <span className="text-sm font-bold bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] bg-clip-text text-transparent">BRONZE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-60">Tap To Paisa</span>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-3">
            <img src={coin} width={48} height={48} className="animate-pulse" />
            <span className="text-5xl font-extrabold tracking-tight">
              {points.toLocaleString()}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm opacity-60">
            <img src={trophy} width={16} height={16} />
            <span>Gold League</span>
            <Arrow className="w-4 h-4 opacity-50" />
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center relative">
          <div className="w-64 h-64 rounded-full bg-gradient-to-b from-[#bf953f] to-[#b38728] p-2 shadow-[0_0_50px_rgba(179,135,40,0.3)] active:scale-95 transition-transform cursor-pointer" onClick={handleClick}>
            <div className="w-full h-full rounded-full bg-[#151516] flex items-center justify-center overflow-hidden relative">
              <img src={notcoin} width={192} height={192} className="object-contain" />
            </div>
          </div>

          {clicks.map((click) => (
            <div
              key={click.id}
              className="absolute text-3xl font-extrabold bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] bg-clip-text text-transparent pointer-events-none animate-float"
              style={{
                left: `${click.x}px`,
                top: `${click.y}px`,
              }}
              onAnimationEnd={() => handleAnimationEnd(click.id)}
            >
              +{pointsToAdd}
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col gap-4 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={highVoltage} width={20} height={20} />
              <div className="flex flex-col">
                <span className="text-sm opacity-60">Energy</span>
                <span className="text-base font-bold">{energy} / 6500</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#ffffff10] h-3 rounded-full overflow-hidden p-[2px] border border-[#ffffff05]">
            <div
              className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] h-full rounded-full transition-all duration-100"
              style={{ width: `${(energy / 6500) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 bg-[#ffffff05] p-2 rounded-2xl border border-[#ffffff05]">
            <div className="flex flex-col items-center justify-center py-3 bg-[#ffffff05] rounded-xl cursor-pointer hover:bg-[#ffffff10] active:scale-95 transition-all">
              <span className="text-xl">🧸</span>
              <span className="text-xs mt-1 font-semibold opacity-80">Shop</span>
            </div>
            
            <div className="flex flex-col items-center justify-center py-3 bg-[#ffffff05] rounded-xl cursor-pointer hover:bg-[#ffffff10] active:scale-95 transition-all" onClick={showUnityAd}>
              <img src={coin} width={20} height={20} />
              <span className="text-xs mt-1 font-semibold opacity-80">Watch ads</span>
            </div>

            <div className="flex flex-col items-center justify-center py-3 bg-[#ffffff05] rounded-xl cursor-pointer hover:bg-[#ffffff10] active:scale-95 transition-all">
              <span className="text-xl">🚀</span>
              <span className="text-xs mt-1 font-semibold opacity-80">Withdrawal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
