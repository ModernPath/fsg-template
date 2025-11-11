import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import PDFDocument from 'pdfkit';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { companyId } = body;
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user has access to this company
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();
      
    if (profileError || profileData.company_id !== companyId) {
      return NextResponse.json({ error: 'Unauthorized access to company data' }, { status: 403 });
    }
    
    // Fetch the company data
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
      
    if (companyError) {
      return NextResponse.json(
        { error: 'Error fetching company data' }, 
        { status: 500 }
      );
    }
    
    // Fetch recommendations
    const { data: recommendations, error: recommendationsError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('company_id', companyId)
      .order('impact_level', { ascending: false });
      
    if (recommendationsError || !recommendations || recommendations.length === 0) {
      return NextResponse.json(
        { error: 'No recommendations found' }, 
        { status: 404 }
      );
    }
    
    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Buffer to store PDF data
    const chunks: Buffer[] = [];
    let result: Buffer;
    
    // Listen for data events
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    // Listen for end event to create result buffer
    doc.on('end', () => {
      result = Buffer.concat(chunks);
    });
    
    // Add company information
    doc.fontSize(25).text('Business Recommendations', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`For: ${companyData.name}`, { align: 'center' });
    doc.fontSize(10).text(`Business ID: ${companyData.business_id || 'N/A'}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Add introduction
    doc.fontSize(12).text('This document contains AI-generated recommendations based on your company\'s financial data and growth goals. These recommendations are designed to help you improve your business performance and achieve your strategic objectives.', {
      align: 'left'
    });
    
    doc.moveDown(2);
    
    // Group recommendations by category
    const categories = ['finance', 'strategy', 'operations', 'marketing', 'other'];
    const groupedRecommendations: Record<string, any[]> = {};
    
    categories.forEach(category => {
      const filtered = recommendations.filter(rec => rec.category === category);
      if (filtered.length > 0) {
        groupedRecommendations[category] = filtered;
      }
    });
    
    // Display recommendations by category
    Object.entries(groupedRecommendations).forEach(([category, recs]) => {
      // Category heading
      doc.fontSize(14).fillColor('#333333').text(
        category.charAt(0).toUpperCase() + category.slice(1) + ' Recommendations', 
        { underline: true }
      );
      doc.moveDown();
      
      // Add each recommendation in this category
      recs.forEach((recommendation, index) => {
        // Title
        doc.fontSize(12).fillColor('#000000').text(`${index + 1}. ${recommendation.title}`);
        doc.moveDown(0.5);
        
        // Description
        doc.fontSize(10).fillColor('#444444').text(recommendation.description);
        doc.moveDown(0.5);
        
        // Implementation details
        doc.fontSize(9).fillColor('#666666').text(`Impact: ${recommendation.impact_level} | Difficulty: ${recommendation.implementation_difficulty} | Timeline: ${recommendation.implementation_timeline}`);
        
        doc.moveDown(1);
      });
      
      doc.moveDown(1);
    });
    
    // Add disclaimer
    doc.moveDown();
    doc.fontSize(8).fillColor('#999999').text('Disclaimer: These recommendations are generated based on the data provided and general business principles. Each business is unique, and you should evaluate these suggestions in the context of your specific situation and consult with appropriate professionals before implementation.', {
      align: 'left'
    });
    
    // Finalize the PDF
    doc.end();
    
    // Wait for the PDF to be generated
    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        // Create a NextResponse with the PDF
        const response = new NextResponse(result);
        
        // Set appropriate headers
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', 'attachment; filename=business-recommendations.pdf');
        
        resolve(response);
      });
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' }, 
      { status: 500 }
    );
  }
} 