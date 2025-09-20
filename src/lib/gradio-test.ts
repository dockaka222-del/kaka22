// Simple Gradio API test
export async function testGradioAPI() {
   const token = process.env.HUGGINGFACE_TOKEN || 'your_hf_token_here';
  const spaceUrl = 'https://huggingface.co/spaces/Plachta/Seed-VC';
  
  try {
    console.log('🔍 Testing Gradio API connection...');
    
    // Test 1: Check if API is available
    const apiInfoResponse = await fetch(`${spaceUrl}/api/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Voice-Cloning-Test/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log('API Info Response Status:', apiInfoResponse.status);
    
    if (apiInfoResponse.ok) {
      const apiInfo = await apiInfoResponse.json();
      console.log('✅ API Info received:', JSON.stringify(apiInfo, null, 2));
      
      // Test 2: Try to call predict endpoint
      if (apiInfo.named_endpoints && (apiInfo.named_endpoints['/predict'] || apiInfo.named_endpoints['/predict_1'])) {
        console.log('🎯 Found predict endpoints, testing call...');
        
        const testData = [
          "test_source.wav",     // source audio
          "test_target.wav",     // target audio  
          10,                    // diffusion steps
          1.0,                   // length adjust
          0.7,                   // inference cfg rate
          false,                 // f0 condition
          true,                  // auto f0 adjust
          0                      // pitch shift
        ];
        
        const predictResponse = await fetch(`${spaceUrl}/api/predict_1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Voice-Cloning-Test/1.0'
          },
          body: JSON.stringify({ data: testData }),
          signal: AbortSignal.timeout(30000)
        });
        
        console.log('Predict Response Status:', predictResponse.status);
        
        if (predictResponse.ok) {
          const result = await predictResponse.json();
          console.log('✅ Predict call successful:', JSON.stringify(result, null, 2));
          return { success: true, result };
        } else {
          const errorText = await predictResponse.text();
          console.log('❌ Predict call failed:', errorText);
          return { success: false, error: errorText };
        }
      } else {
        console.log('⚠️ No predict endpoints found in API info');
        return { success: false, error: 'No predict endpoints available' };
      }
    } else {
      const errorText = await apiInfoResponse.text();
      console.log('❌ API Info failed:', errorText);
      return { success: false, error: 'API Info request failed' };
    }
    
  } catch (error: any) {
    console.error('🔴 Gradio API test failed:', error.message);
    return { success: false, error: error.message };
  }
}