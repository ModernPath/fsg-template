import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Tietojen validointi
interface PreAnalysisRequest {
  companyName: string;
  businessId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
}

/**
 * POST /api/preanalysis
 * Käsittelee alustavan analyysin pyynnön
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PreAnalysisRequest;
    
    // Validoi pakolliset kentät
    if (!body.companyName || !body.businessId || !body.contactName || 
        !body.contactEmail || !body.contactPhone || 
        !body.termsAccepted || !body.marketingConsent) {
      return NextResponse.json(
        { error: 'Kaikki kentät ovat pakollisia' },
        { status: 400 }
      );
    }
    
    // Tässä voitaisiin tehdä yhteys ulkoiseen API:in oikean analyysin tekemiseksi
    // Nyt palautetaan simuloitu analyysi
    
    // Simuloidaan viivettä
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuloitu analyysi
    const analysisResult = {
      companyName: body.companyName,
      businessId: body.businessId,
      riskClass: 'B',
      riskScore: '50+/99',
      financialData: {
        revenue: {
          '2021': 107,
          '2022': 243,
          '2023': 128,
          '2024': 25
        },
        revenueGrowth: {
          '2021': 55.1,
          '2022': 127.1,
          '2023': -47.3,
          '2024': -80.5
        },
        operatingProfit: {
          '2021': 1,
          '2022': 89,
          '2023': -3,
          '2024': -43
        },
        netProfit: {
          '2021': 1,
          '2022': 86,
          '2023': -6,
          '2024': -45
        },
        netProfitGrowth: {
          '2021': 150.0,
          '2022': 8500.0,
          '2023': -107.0,
          '2024': -650.0
        },
        equityRatio: {
          '2021': 2.0,
          '2022': 57.0,
          '2023': 66.3,
          '2024': 17.1
        }
      },
      analysis: 'Yhtiön luottokelpoisuus näyttää haasteelliselta tilinpäätöstiedoin, mutta katsomme mielellämme tarkemmin rahoitustarpeen kansanne. Saadaksesi virallisen luottopäätöksen voit tehdä lainahakemuksen alla olevan linkin kautta.'
    };
    
    // Tallennetaan kontaktitiedot tietokantaan (jos käytössä)
    // const supabase = createClient();
    // const { data, error } = await supabase
    //   .from('preanalysis_contacts')
    //   .insert({
    //     company_name: body.companyName,
    //     business_id: body.businessId,
    //     contact_name: body.contactName,
    //     contact_email: body.contactEmail,
    //     contact_phone: body.contactPhone,
    //     marketing_consent: body.marketingConsent
    //   });
    
    // if (error) {
    //   console.error('Virhe kontaktitietojen tallennuksessa:', error);
    //   // Jatketaan silti, koska analyysi on jo tehty
    // }
    
    return NextResponse.json({
      success: true,
      result: analysisResult
    });
    
  } catch (error) {
    console.error('Virhe alustavan analyysin käsittelyssä:', error);
    return NextResponse.json(
      { error: 'Analyysin käsittelyssä tapahtui virhe' },
      { status: 500 }
    );
  }
} 