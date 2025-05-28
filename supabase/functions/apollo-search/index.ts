
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams, apiKey } = await req.json()
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Apollo.io API key is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build the Apollo.io API URL
    const apolloUrl = new URL('https://api.apollo.io/api/v1/mixed_people/search')
    
    // Add search parameters
    if (searchParams.personTitles) {
      searchParams.personTitles.forEach((title: string) => {
        apolloUrl.searchParams.append('person_titles[]', title)
      })
    }
    
    if (searchParams.location) {
      apolloUrl.searchParams.append('person_locations[]', searchParams.location)
    }
    
    if (searchParams.organizationLocations) {
      searchParams.organizationLocations.forEach((location: string) => {
        apolloUrl.searchParams.append('organization_locations[]', location)
      })
    }
    
    if (searchParams.seniorities) {
      searchParams.seniorities.forEach((seniority: string) => {
        apolloUrl.searchParams.append('person_seniorities[]', seniority)
      })
    }
    
    if (searchParams.emailStatus) {
      searchParams.emailStatus.forEach((status: string) => {
        apolloUrl.searchParams.append('contact_email_status[]', status)
      })
    }
    
    if (searchParams.employeeRanges) {
      searchParams.employeeRanges.forEach((range: string) => {
        apolloUrl.searchParams.append('organization_num_employees_ranges[]', range)
      })
    }

    if (searchParams.keywords && searchParams.keywords.length > 0) {
      const keywordsString = searchParams.keywords.join(" ")
      apolloUrl.searchParams.append('q_keywords', keywordsString)
    }
    
    apolloUrl.searchParams.append('page', '1')
    apolloUrl.searchParams.append('per_page', (searchParams.limit || 20).toString())

    console.log('Making Apollo.io API request to:', apolloUrl.toString())

    // Make the request to Apollo.io API
    const response = await fetch(apolloUrl.toString(), {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-api-key': apiKey
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Apollo.io API error: ${response.status} - ${errorText}`)
      
      let errorMessage = 'Apollo.io API request failed'
      if (response.status === 401) {
        errorMessage = 'Invalid Apollo.io API key'
      } else if (response.status === 429) {
        errorMessage = 'Apollo.io API rate limit exceeded'
      } else if (response.status === 403) {
        errorMessage = 'Apollo.io API access forbidden'
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: errorText }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Apollo.io API response received successfully')

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
