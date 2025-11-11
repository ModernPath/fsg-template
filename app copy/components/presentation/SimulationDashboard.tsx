'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

// KPI-arvojen tyypit
interface KpiValues {
  liikevaihto: string;
  kayttokate: string;
  omavaraisuus: string;
  kassavirta: string;
}

// Rahoitustyyppi ja siihen liittyvä kuvaus
interface RahoitusType {
  nimi: string;
  kuvaus: string;
  kayttotilanne: string;
  tyypillinenAsiakas: string;
}

// Värimäärittelyt
const colors = {
  primary: "#00d2ff",
  secondary: "#0088cc",
  background: "#111827",
  metallic: "linear-gradient(135deg, #333, #888, #333)",
  neon: "0 0 15px #0ff",
  sector: {
    active: "rgba(0, 210, 255, 0.5)",
    inactive: "rgba(40, 50, 70, 0.7)"
  }
}

export default function SimulationDashboard() {
  const t = useTranslations('SimulationDashboard')
  // Rahoitustyyppien tiedot käännöksistä
  const rahoitustyypit: Record<string, RahoitusType> = {
    "Yrityslaina": {
      nimi: t('typeNames.Yrityslaina'),
      kuvaus: t('typeDescriptions.Yrityslaina'),
      kayttotilanne: t('typeUsages.Yrityslaina'),
      tyypillinenAsiakas: t('typeCustomers.Yrityslaina')
    },
    "Yrityslimiitti": {
      nimi: t('typeNames.Yrityslimiitti'),
      kuvaus: t('typeDescriptions.Yrityslimiitti'),
      kayttotilanne: t('typeUsages.Yrityslimiitti'),
      tyypillinenAsiakas: t('typeCustomers.Yrityslimiitti')
    },
    "Factoring": {
      nimi: t('typeNames.Factoring'),
      kuvaus: t('typeDescriptions.Factoring'),
      kayttotilanne: t('typeUsages.Factoring'),
      tyypillinenAsiakas: t('typeCustomers.Factoring')
    },
    "Leasing": {
      nimi: t('typeNames.Leasing'),
      kuvaus: t('typeDescriptions.Leasing'),
      kayttotilanne: t('typeUsages.Leasing'),
      tyypillinenAsiakas: t('typeCustomers.Leasing')
    }
  };

  // Tila aktiiviselle sektorille (asteina, 0 = Yrityslaina, 90 = Yrityslimiitti, 180 = Factoring, 270 = Leasing)
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [activeSector, setActiveSector] = useState<string>("Yrityslaina");
  
  // KPI-arvot - päivitetty kassavirta olemaan 12.5% liikevaihdosta
  const [kpiValues, setKpiValues] = useState<KpiValues>({
    liikevaihto: "370K€", // 370 * 1000
    kayttokate: "144K",
    omavaraisuus: "40,5%",
    kassavirta: "46.3K€" // 370 * 0.125 = 46.25K€, pyöristetty
  });
  
  // Liukusäätimien arvot - rahoitusKorko korvattu kassavirtaMuutoksella
  const [sliders, setSliders] = useState({
    liikevaihtoMuutos: 6,
    kulutMuutos: -2,
    kassavirtaMuutos: 0 // Uusi slider, oletusarvo 0%
  });
  
  // Yrityksen rahoitusasema (hyvä, neutraali, kriittinen)
  const [rahoitusAsema, setRahoitusAsema] = useState<string>("Hyvä");
  
  // Päivitetään rahoitusasema, kun liukusäätimet muuttuvat
  useEffect(() => {
    // Kehittyneempi logiikka rahoitusaseman määrittämiseen
    const painotettuLiikevaihto = sliders.liikevaihtoMuutos * 0.4; // Liikevaihdon vaikutus, esim. 30 * 0.4 = 12 pistettä
    
    // Kulujen muutoksen vaikutus: negatiivinen muutos (säästö) on positiivinen pisteille
    const painotetutKulut = -sliders.kulutMuutos * 0.3; // Esim. -20 * -0.3 = +6 pistettä, +20 * -0.3 = -6 pistettä

    // Vakiokoron (12%) vaikutus, johon kulujen muutos vaikuttaa
    // Jos kulut nousevat (positiivinen kulutMuutos), efektiivinen korko nousee ja pisteet laskevat.
    // Jos kulut laskevat (negatiivinen kulutMuutos), efektiivinen korko laskee ja pisteet nousevat.
    const baseInterest = 0.12; // 12%
    const interestChangeDueToCosts = baseInterest * (sliders.kulutMuutos / 100);
    const effectiveInterestRate = baseInterest + interestChangeDueToCosts;
    // Skaalataan vaikutus pisteisiin. Oletetaan, että 12% korko on neutraali (-3 pistettä), ja vaihtelu sen ympärillä muuttaa tätä.
    // Jos effectiveInterestRate on 0.12 (kulutMuutos = 0), fixedInterestImpact = -3
    // Jos kulutMuutos = 20% -> effectiveInterestRate = 0.12 * 1.2 = 0.144. Impact = -(0.144 / 0.12) * 3 = -3.6
    // Jos kulutMuutos = -20% -> effectiveInterestRate = 0.12 * 0.8 = 0.096. Impact = -(0.096 / 0.12) * 3 = -2.4
    const fixedInterestImpact = -(effectiveInterestRate / baseInterest) * 3;


    // Uuden kassavirran muutoksen vaikutus
    const painotettuKassavirtaMuutos = sliders.kassavirtaMuutos * 0.2; // Esim. 30 * 0.2 = +6 pistettä, -15 * 0.2 = -3 pistettä
    
    const kokonaispisteet = painotettuLiikevaihto + painotetutKulut + fixedInterestImpact + painotettuKassavirtaMuutos;
    
    // Pisteet välillä, esim. -15 ... +15 (säädä tarvittaessa raja-arvoja)
    if (kokonaispisteet > 3) {
      setRahoitusAsema("Hyvä");
    } else if (kokonaispisteet > -3) {
      setRahoitusAsema("Neutraali");
    } else {
      setRahoitusAsema("Kriittinen");
    }
    
    // Päivitetään KPI-arvoja dynaamisesti liukusäätimien pohjalta
    // Luodaan simuloitu vaikutus arvoihin
    updateKpiValues(activeSector, true);
  }, [sliders, activeSector]);
  
  // Funktio sektorin vaihtamiseen näpin kääntämisellä
  const rotateToDegree = (degree: number) => {
    // Emme aseta rotationDegreesia, koska käytämme aina fixed-asettelua
    // jossa valinta on oikeassa yläkulmassa (90 astetta)
    
    // Määritetään aktiivinen sektori asteen perusteella
    let sector;
    if (degree === 0) {
      sector = "Yrityslaina";
    } else if (degree === 90) {
      sector = "Yrityslimiitti";
    } else if (degree === 180) {
      sector = "Factoring";
    } else if (degree === 270) {
      sector = "Leasing";
    }
    
    setActiveSector(sector || "Yrityslaina");
    updateKpiValues(sector || "Yrityslaina");
  };
  
  // Päivitetään KPI-arvot valitun sektorin mukaan
  const updateKpiValues = (sector: string, withSliderEffect = false) => {
    // Pohjatiedot - kassavirta 12.5% liikevaihdosta
    let baseValues = {
      liikevaihto: 370, // K€
      kayttokate: 144, // K€
      omavaraisuus: 40.5, // %
      kassavirta: 370 * 0.125, // K€
    };
    
    // Rahoitustyypin vaikutus pohjatietoihin - kassavirta 12.5% liikevaihdosta
    switch(sector) {
      case "Yrityslaina":
        // Perusarvot jo asetettu
        break;
      case "Yrityslimiitti":
        baseValues.liikevaihto = 400;
        baseValues.kayttokate = 150;
        baseValues.omavaraisuus = 38.2;
        baseValues.kassavirta = 400 * 0.125;
        break;
      case "Factoring":
        baseValues.liikevaihto = 435;
        baseValues.kayttokate = 140;
        baseValues.omavaraisuus = 37.8;
        baseValues.kassavirta = 435 * 0.125;
        break;
      case "Leasing":
        baseValues.liikevaihto = 335;
        baseValues.kayttokate = 127;
        baseValues.omavaraisuus = 41.3;
        baseValues.kassavirta = 335 * 0.125;
        break;
    }
    
    // Jos tämä on liukusäätimien aiheuttama muutos, päivitetään arvoja niiden mukaisesti
    if (withSliderEffect) {
      // Liikevaihdon muutoksen vaikutus
      baseValues.liikevaihto *= (1 + sliders.liikevaihtoMuutos / 100);
      
      // Kulujen muutoksen vaikutus käyttökatteeseen (käänteinen suhde)
      baseValues.kayttokate *= (1 - sliders.kulutMuutos / 100);
      
      // Kassavirran muutoksen vaikutus kassavirtaan (uusi slider)
      baseValues.kassavirta *= (1 + sliders.kassavirtaMuutos / 100);
      
      // Rahoitusasemaan liittyvät päivitykset - omavaraisuus
      // Kassavirran muutoksen vaikutus omavaraisuuteen korvaa aiemman rahoitusKorko-vaikutuksen
      // Normalisoidaan kassavirtaMuutos (-15% to 30%) vastaamaan vanhaa rahoitusKorko-vaikutusta (0-20 penalty)
      // Kun kassavirtaMuutos = -15 (huonoin), penalty = 20. Kun kassavirtaMuutos = 30 (paras), penalty = 0.
      const kassavirtaPenalty = ( ( (sliders.kassavirtaMuutos + 15) / 45 ) * -20 ) + 20;
      baseValues.omavaraisuus *= (1 + (sliders.liikevaihtoMuutos - sliders.kulutMuutos - kassavirtaPenalty) / 200);
    }
    
    // Muotoillaan arvot näytettävään muotoon
    setKpiValues({
      liikevaihto: baseValues.liikevaihto < 1000 
        ? Math.round(baseValues.liikevaihto) + "K€" 
        : (baseValues.liikevaihto / 1000).toFixed(1) + "M€",
      kayttokate: Math.round(baseValues.kayttokate) + "K",
      omavaraisuus: baseValues.omavaraisuus.toFixed(1) + "%",
      kassavirta: baseValues.kassavirta < 1000 
        ? Math.round(baseValues.kassavirta) + "K€" // Lisätty K€ kassavirtaan selkeyden vuoksi
        : (baseValues.kassavirta / 1000).toFixed(1) + "M€" // Lisätty M€ kassavirtaan selkeyden vuoksi
    });
  };
  
  // Sektorin valintafunktio
  const handleSectorClick = (sector: string) => {
    // Asetetaan vain aktiivinen sektori, ei pyörimisastetta
    setActiveSector(sector);
    updateKpiValues(sector);
  };
  
  // Liukusäätimien käsittelyfunktio
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const value = parseInt(event.target.value);
    
    setSliders(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  // Rahoitusaseman väri
  const getStatusColor = () => {
    switch(rahoitusAsema) {
      case "Hyvä": return "#00d2ff";
      case "Neutraali": return "#f9a825";
      case "Kriittinen": return "#f44336";
      default: return "#00d2ff";
    }
  };

  // Rahoitusaseman analyysiteksti käännöksistä
  const getAnalyysiteksti = () => {
    // Yleinen teksti rahoitusaseman mukaan
    const perusteksti = t(`analysisText.${rahoitusAsema === "Hyvä" ? "Hyva" : rahoitusAsema}`);

    let lisainfo = "";
    if (sliders.liikevaihtoMuutos > 15) {
      lisainfo += t('analysisText.revenueStrong');
    } else if (sliders.liikevaihtoMuutos < 0) {
      lisainfo += t('analysisText.revenueWeak');
    }
    if (sliders.kulutMuutos > 10) {
      lisainfo += t('analysisText.expenseStrong');
    } else if (sliders.kulutMuutos < -10) {
      lisainfo += t('analysisText.expenseWeak');
    }
    if (sliders.kassavirtaMuutos < -5) {
      lisainfo += t('analysisText.cashflowWeak');
    } else if (sliders.kassavirtaMuutos > 10) {
      lisainfo += t('analysisText.cashflowStrong');
    }
    switch (activeSector) {
      case "Yrityslaina":
        if (rahoitusAsema === "Kriittinen") {
          lisainfo += t('analysisText.sectorCriticalLoan');
        } else if (rahoitusAsema === "Hyvä") {
          lisainfo += t('analysisText.sectorGoodLoan');
        }
        break;
      case "Yrityslimiitti":
        if (sliders.liikevaihtoMuutos < 0) {
          lisainfo += t('analysisText.sectorLimit');
        }
        break;
      case "Factoring":
        if (sliders.liikevaihtoMuutos > 0 && sliders.kulutMuutos > 0) {
          lisainfo += t('analysisText.sectorFactoring');
        }
        break;
      case "Leasing":
        if (sliders.kulutMuutos > 0) {
          lisainfo += t('analysisText.sectorLeasing');
        }
        break;
    }
    return perusteksti + lisainfo;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12 text-gold-primary text-center">
        {t('title')}
      </h2>
      <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-4 sm:gap-8 lg:gap-16">
        {/* Vasemmanpuoleinen dashboard */}
        <div className="w-full lg:w-7/12 flex flex-col items-center">
          <div className="relative w-full max-w-[350px] sm:max-w-[450px] md:max-w-[600px] aspect-square rounded-full bg-gradient-to-br from-black via-gray-900 to-gray-950 shadow-[0_0_60px_rgba(0,210,255,0.15)] border border-blue-900/40 flex items-center justify-center">
            {/* KPI-renkaat ja arvot */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Ulompi rengas */}
              <div className="absolute w-[95%] h-[95%] rounded-full border border-blue-500/20"></div>
              {/* Keskikokoinen rengas */}
              <div className="absolute w-[80%] h-[80%] rounded-full border border-blue-500/20"></div>
              {/* Sisempi rengas */}
              <div className="absolute w-[70%] h-[70%] rounded-full border border-blue-500/20"></div>
              {/* KPI-arvot neljässä kulmassa, responsiivinen fontti ja spacing */}
              <div className="absolute top-[3%] sm:top-[8%] w-full text-center z-10">
                <div className="text-xs sm:text-sm text-gray-400 inline-block mb-0.5 sm:mb-1">{t('kpi.revenue')}</div>
                <div className="text-lg sm:text-2xl text-cyan-400 font-bold bg-gray-950/80 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 inline-block shadow-[0_0_10px_rgba(0,210,255,0.3)]">{kpiValues.liikevaihto}</div>
              </div>
              <div className="absolute right-[2%] sm:right-[5%] top-1/2 -translate-y-1/2 text-right z-10">
                <div className="text-xs sm:text-sm text-gray-400 inline-block mb-0.5 sm:mb-1">{t('kpi.cashflow')}</div>
                <div className="text-lg sm:text-2xl text-cyan-400 font-bold bg-gray-950/80 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 inline-block shadow-[0_0_10px_rgba(0,210,255,0.3)]">{kpiValues.kassavirta}</div>
              </div>
              <div className="absolute bottom-[3%] sm:bottom-[8%] w-full text-center z-10">
                <div className="text-xs sm:text-sm text-gray-400 inline-block mb-0.5 sm:mb-1">{t('kpi.ebitda')}</div>
                <div className="text-lg sm:text-2xl text-cyan-400 font-bold bg-gray-950/80 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 inline-block shadow-[0_0_10px_rgba(0,210,255,0.3)]">{kpiValues.kayttokate}</div>
              </div>
              <div className="absolute left-[2%] sm:left-[5%] top-1/2 -translate-y-1/2 text-left z-10">
                <div className="text-xs sm:text-sm text-gray-400 inline-block mb-0.5 sm:mb-1">{t('kpi.equity')}</div>
                <div className="text-lg sm:text-2xl text-cyan-400 font-bold bg-gray-950/80 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 inline-block shadow-[0_0_10px_rgba(0,210,255,0.3)]">{kpiValues.omavaraisuus}</div>
              </div>
            </div>
            
            {/* Kääntönuppi/rotary dial - aina kiinteä asettelu */}
            <div className="relative w-[55%] sm:w-[65%] h-[55%] sm:h-[65%] rounded-full bg-gradient-to-br from-gray-800 to-gray-950 shadow-inner shadow-cyan-900/20 border border-gray-700 flex items-center justify-center overflow-hidden">
              {/* Sektorit */}
              <div className="absolute inset-0">
                {/* Yrityslaina - Vasen yläkulma */}
                <div 
                  className={`absolute top-0 left-0 w-1/2 h-1/2 rounded-tl-full border-r border-b border-gray-800 flex items-center justify-center cursor-pointer transition-all duration-300 ${activeSector === "Yrityslaina" ? "bg-gradient-to-br from-cyan-900/70 to-cyan-700/30 hover:from-cyan-900/80 hover:to-cyan-700/40" : "bg-gray-900/50 hover:bg-gray-800/70"}`}
                  onClick={() => handleSectorClick("Yrityslaina")}
                >
                  <div className={`text-center -rotate-45 ml-4 mb-4 ${activeSector === "Yrityslaina" ? "text-cyan-300" : "text-gray-400"}`}>
                    <span className={`text-lg font-medium ${activeSector === "Yrityslaina" ? "text-cyan-300" : "text-gray-300"}`}>
                      {t('typeNames.Yrityslaina')}
                    </span>
                  </div>
                </div>
                
                {/* Yrityslimiitti - Oikea yläkulma */}
                <div 
                  className={`absolute top-0 right-0 w-1/2 h-1/2 rounded-tr-full border-l border-b border-gray-800 flex items-center justify-center cursor-pointer transition-all duration-300 ${activeSector === "Yrityslimiitti" ? "bg-gradient-to-bl from-cyan-900/70 to-cyan-700/30 hover:from-cyan-900/80 hover:to-cyan-700/40" : "bg-gray-900/50 hover:bg-gray-800/70"}`}
                  onClick={() => handleSectorClick("Yrityslimiitti")}
                >
                  <div className={`text-center rotate-45 mr-4 mb-4 ${activeSector === "Yrityslimiitti" ? "text-cyan-300" : "text-gray-400"}`}>
                    <span className={`text-lg font-medium ${activeSector === "Yrityslimiitti" ? "text-cyan-300" : "text-gray-300"}`}>
                      {t('typeNames.Yrityslimiitti')}
                    </span>
                  </div>
                </div>
                
                {/* Factoring - Oikea alakulma */}
                <div 
                  className={`absolute bottom-0 right-0 w-1/2 h-1/2 rounded-br-full border-l border-t border-gray-800 flex items-center justify-center cursor-pointer transition-all duration-300 ${activeSector === "Factoring" ? "bg-gradient-to-tl from-cyan-900/70 to-cyan-700/30 hover:from-cyan-900/80 hover:to-cyan-700/40" : "bg-gray-900/50 hover:bg-gray-800/70"}`}
                  onClick={() => handleSectorClick("Factoring")}
                >
                  <div className={`text-center -rotate-45 mr-4 mt-4 ${activeSector === "Factoring" ? "text-cyan-300" : "text-gray-400"}`}>
                    <span className={`text-lg font-medium ${activeSector === "Factoring" ? "text-cyan-300" : "text-gray-300"}`}>
                      {t('typeNames.Factoring')}
                    </span>
                  </div>
                </div>
                
                {/* Leasing - Vasen alakulma */}
                <div 
                  className={`absolute bottom-0 left-0 w-1/2 h-1/2 rounded-bl-full border-r border-t border-gray-800 flex items-center justify-center cursor-pointer transition-all duration-300 ${activeSector === "Leasing" ? "bg-gradient-to-tr from-cyan-900/70 to-cyan-700/30 hover:from-cyan-900/80 hover:to-cyan-700/40" : "bg-gray-900/50 hover:bg-gray-800/70"}`}
                  onClick={() => handleSectorClick("Leasing")}
                >
                  <div className={`text-center rotate-45 ml-4 mt-4 ${activeSector === "Leasing" ? "text-cyan-300" : "text-gray-400"}`}>
                    <span className={`text-lg font-medium ${activeSector === "Leasing" ? "text-cyan-300" : "text-gray-300"}`}>
                      {t('typeNames.Leasing')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Keskellä oleva pallo */}
              <div className="absolute w-[25%] h-[25%] rounded-full bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 shadow-[0_0_15px_rgba(0,210,255,0.3)] border border-gray-500 z-10">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-gray-500/30 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Liukusäätimet */}
          <div className="w-full max-w-[350px] sm:max-w-[600px] mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-black via-gray-900 to-gray-950 rounded-xl border border-blue-900/30">
            <div className="space-y-10">
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm text-gray-300">{t('slider.revenueChange')}</label>
                  <span className="text-cyan-400 font-medium">{sliders.liikevaihtoMuutos} %</span>
                </div>
                <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <input 
                    type="range" 
                    min="-20" 
                    max="30" 
                    value={sliders.liikevaihtoMuutos} 
                    onChange={(e) => handleSliderChange(e, "liikevaihtoMuutos")}
                    className="absolute top-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                    style={{ width: `${((sliders.liikevaihtoMuutos + 20) / 50) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(0,210,255,0.5)]"
                    style={{ left: `calc(${((sliders.liikevaihtoMuutos + 20) / 50) * 100}% - 10px)` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm text-gray-300">{t('slider.expenseChange')}</label>
                  <span className="text-cyan-400 font-medium">{sliders.kulutMuutos} %</span>
                </div>
                <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <input 
                    type="range" 
                    min="-20" 
                    max="20" 
                    value={sliders.kulutMuutos} 
                    onChange={(e) => handleSliderChange(e, "kulutMuutos")}
                    className="absolute top-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                    style={{ width: `${((sliders.kulutMuutos + 20) / 40) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(0,210,255,0.5)]"
                    style={{ left: `calc(${((sliders.kulutMuutos + 20) / 40) * 100}% - 10px)` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm text-gray-300">{t('slider.cashflowChange')}</label>
                  <span className="text-cyan-400 font-medium">{sliders.kassavirtaMuutos} %</span>
                </div>
                <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <input 
                    type="range" 
                    min="-15" 
                    max="30" 
                    value={sliders.kassavirtaMuutos} 
                    onChange={(e) => handleSliderChange(e, "kassavirtaMuutos")}
                    className="absolute top-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                    style={{ width: `${((sliders.kassavirtaMuutos + 15) / 45) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(0,210,255,0.5)]"
                    style={{ left: `calc(${((sliders.kassavirtaMuutos + 15) / 45) * 100}% - 10px)` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Oikeanpuoleinen sarake */}
        <div className="w-full lg:w-4/12 flex flex-col justify-between h-full mt-4 lg:mt-0">
          {/* Rahoitusasema-kortti */}
          <div className="p-8 bg-gradient-to-br from-black via-gray-900 to-gray-950 rounded-3xl shadow-[0_0_40px_rgba(0,150,255,0.1)] border border-blue-900/30 h-auto">
            <h3 className="text-2xl font-bold text-center text-gray-200 mb-6">
              {t('status.title')}
            </h3>
            
            <div className="flex items-center justify-center mb-8">
              <div 
                className="text-4xl font-bold py-4 px-12 rounded-full mb-6"
                style={{
                  backgroundColor: `${getStatusColor()}20`,
                  color: getStatusColor(),
                  border: `2px solid ${getStatusColor()}40`,
                  boxShadow: `0 0 20px ${getStatusColor()}30`
                }}
              >
                {rahoitusAsema}
              </div>
            </div>
            
            {/* Tarkennettu analyysi */}
            <div className="mb-8 text-sm text-gray-300 text-center">
              {getAnalyysiteksti()}
            </div>
            
            {/* Numeraalinen yhteenveto */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-900/50 p-2 rounded">
                <span className="text-gray-400">{t('status.solvency')}</span>
                <span className={`ml-1 ${rahoitusAsema === "Hyvä" ? "text-cyan-400" : rahoitusAsema === "Neutraali" ? "text-yellow-400" : "text-red-400"}`}>{rahoitusAsema === "Hyvä" ? t('status.strong') : rahoitusAsema === "Neutraali" ? t('status.moderate') : t('status.weak')}</span>
              </div>
              <div className="bg-gray-900/50 p-2 rounded">
                <span className="text-gray-400">{t('status.liquidity')}</span>
                <span className={`ml-1 ${sliders.liikevaihtoMuutos - sliders.kulutMuutos > 5 ? "text-cyan-400" : sliders.liikevaihtoMuutos - sliders.kulutMuutos > -5 ? "text-yellow-400" : "text-red-400"}`}>{sliders.liikevaihtoMuutos - sliders.kulutMuutos > 5 ? t('status.good') : sliders.liikevaihtoMuutos - sliders.kulutMuutos > -5 ? t('status.satisfactory') : t('status.weak')}</span>
              </div>
              <div className="bg-gray-900/50 p-2 rounded">
                <span className="text-gray-400">{t('status.profitability')}</span>
                <span className={`ml-1 ${sliders.kulutMuutos < 0 ? "text-cyan-400" : sliders.kulutMuutos < 10 ? "text-yellow-400" : "text-red-400"}`}>{sliders.kulutMuutos < 0 ? t('status.improving') : sliders.kulutMuutos < 10 ? t('status.stable') : t('status.declining')}</span>
              </div>
              <div className="bg-gray-900/50 p-2 rounded">
                <span className="text-gray-400">{t('status.cashflowStability')}</span>
                <span className={`ml-1 ${sliders.kassavirtaMuutos > 10 ? "text-cyan-400" : sliders.kassavirtaMuutos > -5 ? "text-yellow-400" : "text-red-400"}`}>{sliders.kassavirtaMuutos > 10 ? t('status.good') : sliders.kassavirtaMuutos > -5 ? t('status.moderate') : t('status.weak')}</span>
              </div>
            </div>
          </div>
          
          {/* Aktiivisen rahoitustyypin kuvaus */}
          <div className="mt-8 p-8 bg-gradient-to-br from-black via-gray-900/60 to-gray-950 rounded-3xl shadow-[0_0_40px_rgba(0,150,255,0.05)] border border-blue-900/20 h-auto flex-grow">
            {activeSector && (
              <div>
                <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">{rahoitustyypit[activeSector].nimi}</h3>
                <div className="space-y-4">
                  <div className="bg-gray-900/40 p-3 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">{t('type.description')}</p>
                    <p className="text-white">{rahoitustyypit[activeSector].kuvaus}</p>
                  </div>
                  <div className="bg-gray-900/40 p-3 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">{t('type.usage')}</p>
                    <p className="text-white">{rahoitustyypit[activeSector].kayttotilanne}</p>
                  </div>
                  <div className="bg-gray-900/40 p-3 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">{t('type.customer')}</p>
                    <p className="text-white">{rahoitustyypit[activeSector].tyypillinenAsiakas}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 sm:mt-8 text-center max-w-3xl mx-auto">
        <p className="text-xs sm:text-sm text-gray-400">{t('infoText')}</p>
      </div>
    </div>
  )
} 