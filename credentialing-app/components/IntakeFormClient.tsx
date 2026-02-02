'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react'

// Reuse the same constants from the admin intake form
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const COMMERCIAL_PAYERS = [
  'Aetna',
  'Blue Cross Blue Shield',
  'Cigna', 
  'UnitedHealthcare',
  'Humana',
  'Anthem',
  'Kaiser Permanente',
  'Centene',
  'Molina Healthcare',
  'WellCare'
]

interface IntakeFormClientProps {
  userId: string
  userEmail: string
  existingData?: any
  isEdit?: boolean
}

export default function IntakeFormClient({ 
  userId, 
  userEmail,
  existingData,
  isEdit = false 
}: IntakeFormClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Initialize form with existing data if editing
  const [formData, setFormData] = useState(existingData || {
    // Part 1: Basic Practice Information
    current_operating_states: [] as string[],
    credentialing_type: '',
    business_entity_type: '',
    has_npi: '',
    npi_type: '',
    npi_number: '',
    tax_id_type: '',
    tax_id: '',
    
    // New State Expansion
    target_states: [] as string[],
    has_business_entity_new_state: '',
    needs_entity_setup: false,
    has_physical_location: '',
    new_state_address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    
    // Part 2: Provider Information
    providers_count: '1',
    primary_provider: {
      full_name: '',
      date_of_birth: '',
      ssn: '',
      current_licenses: [] as { state: string; license_number: string }[],
      bcba_cert_number: '',
      bcba_cert_expiration: '',
      individual_npi: '',
      email: userEmail || '',
      phone: ''
    },
    additional_providers: [] as any[],
    
    // Part 3: Target Payers
    wants_medicaid: '',
    medicaid_mcos: [] as string[],
    commercial_payers: [] as string[],
    payer_priority: '',
    
    // Part 4: Current Documentation Status
    has_caqh: '',
    caqh_updated: '',
    caqh_id: '',
    has_prof_liability: '',
    prof_liability_carrier: '',
    prof_liability_expiration: '',
    has_gen_liability: '',
    gen_liability_carrier: '',
    gen_liability_expiration: '',
    has_bcba_cert_docs: '',
    has_state_licenses: '',
    has_current_cv: '',
    has_references: '',
    references_count: '',
    
    // Part 5: Practice Information
    business_name: '',
    practice_phone: '',
    practice_fax: '',
    practice_email: userEmail || '',
    office_hours: '',
    services_provided: [] as string[],
    
    // Contact Information
    contact_name: '',
    contact_phone: '',
    contact_email: userEmail || '',
    preferred_contact_method: 'email'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('new_state_address_')) {
      const field = name.replace('new_state_address_', '')
      setFormData((prev: any) => ({
        ...prev,
        new_state_address: {
          ...prev.new_state_address,
          [field]: value
        }
      }))
    } else if (name.startsWith('primary_provider_')) {
      const field = name.replace('primary_provider_', '')
      setFormData((prev: any) => ({
        ...prev,
        primary_provider: {
          ...prev.primary_provider,
          [field]: value
        }
      }))
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      const currentValue = formData[name as keyof typeof formData]
      
      if (Array.isArray(currentValue)) {
        if (target.checked) {
          setFormData((prev: any) => ({
            ...prev,
            [name]: [...currentValue, value]
          }))
        } else {
          setFormData((prev: any) => ({
            ...prev,
            [name]: currentValue.filter((v: string) => v !== value)
          }))
        }
      } else {
        setFormData((prev: any) => ({
          ...prev,
          [name]: target.checked
        }))
      }
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEdit && existingData?.id) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            business_name: formData.business_name,
            business_entity_type: formData.business_entity_type,
            current_states: formData.current_operating_states,
            target_states: formData.target_states,
            practice_address_new_state: formData.has_physical_location === 'yes' ? formData.new_state_address : null,
            phone: formData.practice_phone,
            email: formData.practice_email,
            fax: formData.practice_fax,
            tax_id: formData.tax_id,
            tax_id_type: formData.tax_id_type,
            credentialing_type: formData.credentialing_type,
            has_npi: formData.has_npi === 'yes',
            npi_type: formData.npi_type,
            npi_individual: formData.npi_type === 'individual' ? formData.npi_number : null,
            npi_group: formData.npi_type === 'group' ? formData.npi_number : null,
            has_business_entity_new_state: formData.has_business_entity_new_state === 'yes',
            has_physical_location: formData.has_physical_location,
            office_hours: formData.office_hours,
            services_provided: formData.services_provided,
            contact_name: formData.contact_name,
            contact_phone: formData.contact_phone,
            contact_email: formData.contact_email,
            preferred_contact_method: formData.preferred_contact_method,
            status: 'intake_complete'
          })
          .eq('id', existingData.id)

        if (updateError) throw updateError
        
        router.push('/portal')
      } else {
        // Create new client linked to Clerk user ID
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: userId, // This is now the Clerk user ID
            business_name: formData.business_name,
            business_entity_type: formData.business_entity_type,
            current_states: formData.current_operating_states,
            target_states: formData.target_states,
            practice_address_new_state: formData.has_physical_location === 'yes' ? formData.new_state_address : null,
            phone: formData.practice_phone,
            email: formData.practice_email,
            fax: formData.practice_fax,
            tax_id: formData.tax_id,
            tax_id_type: formData.tax_id_type,
            credentialing_type: formData.credentialing_type,
            has_npi: formData.has_npi === 'yes',
            npi_type: formData.npi_type,
            npi_individual: formData.npi_type === 'individual' ? formData.npi_number : null,
            npi_group: formData.npi_type === 'group' ? formData.npi_number : null,
            has_business_entity_new_state: formData.has_business_entity_new_state === 'yes',
            has_physical_location: formData.has_physical_location,
            office_hours: formData.office_hours,
            services_provided: formData.services_provided,
            contact_name: formData.contact_name,
            contact_phone: formData.contact_phone,
            contact_email: formData.contact_email,
            preferred_contact_method: formData.preferred_contact_method,
            status: 'intake_complete'
          })
          .select()
          .single()

        if (clientError) throw clientError

        // Insert primary provider
        if (client) {
          const { error: providerError } = await supabase
            .from('providers')
            .insert({
              client_id: client.id,
              full_name: formData.primary_provider.full_name,
              date_of_birth: formData.primary_provider.date_of_birth || null,
              ssn: formData.primary_provider.ssn,
              email: formData.primary_provider.email,
              phone: formData.primary_provider.phone,
              bcba_cert_number: formData.primary_provider.bcba_cert_number,
              bcba_cert_expiration: formData.primary_provider.bcba_cert_expiration || null,
              individual_npi: formData.primary_provider.individual_npi,
              caqh_id: formData.caqh_id || null,
              has_caqh: formData.has_caqh === 'yes',
              caqh_updated: formData.caqh_updated === 'yes',
              has_current_cv: formData.has_current_cv === 'yes',
              has_references: formData.has_references === 'yes',
              state_licenses: formData.primary_provider.current_licenses
            })

          if (providerError) throw providerError

          // Insert insurance information
          if (formData.has_prof_liability === 'yes' || formData.has_gen_liability === 'yes') {
            const { error: insuranceError } = await supabase
              .from('insurance_information')
              .insert({
                client_id: client.id,
                has_professional_liability: formData.has_prof_liability === 'yes',
                prof_liability_carrier: formData.prof_liability_carrier || null,
                prof_liability_expiration: formData.prof_liability_expiration || null,
                has_general_liability: formData.has_gen_liability === 'yes',
                gen_liability_carrier: formData.gen_liability_carrier || null,
                gen_liability_expiration: formData.gen_liability_expiration || null
              })

            if (insuranceError) throw insuranceError
          }

          // Insert target payers
          const payersToInsert = []
          
          if (formData.wants_medicaid === 'yes' && formData.target_states.length > 0) {
            formData.target_states.forEach((state, index) => {
              payersToInsert.push({
                client_id: client.id,
                payer_name: `${state} Medicaid`,
                payer_type: 'medicaid',
                priority: index + 1
              })
            })
          }
          
          formData.commercial_payers.forEach((payer: string, index: number) => {
            const basePriority = formData.wants_medicaid === 'yes' ? formData.target_states.length : 0
            payersToInsert.push({
              client_id: client.id,
              payer_name: payer,
              payer_type: 'commercial',
              priority: basePriority + index + 1
            })
          })
          
          if (payersToInsert.length > 0) {
            const { error: payersError } = await supabase
              .from('target_payers')
              .insert(payersToInsert)

            if (payersError) throw payersError
          }

          // Create intake status record
          await supabase.from('intake_status').insert({
            client_id: client.id,
            has_bcba_cert_docs: formData.has_bcba_cert_docs === 'yes',
            has_state_licenses: formData.has_state_licenses === 'yes',
            has_current_cv: formData.has_current_cv === 'yes',
            has_references: formData.has_references === 'yes',
            wants_medicaid: formData.wants_medicaid === 'yes',
            commercial_payers: formData.commercial_payers,
            payer_priority: formData.payer_priority
          })

          // Log timeline event
          await supabase
            .from('timeline_events')
            .insert({
              client_id: client.id,
              event_type: 'intake_complete',
              description: 'Client completed initial intake form'
            })
        }

        router.push('/portal')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the form')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setCurrentStep(prev => Math.min(prev + 1, 6))
  }
  
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const steps = [
    'Basic Info',
    'Provider',
    'Payers',
    'Documents',
    'Practice',
    'Review'
  ]

  // The form JSX is the same as the admin intake form
  // but simplified for client self-service
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                currentStep > index + 1 
                  ? 'bg-green-600 text-white' 
                  : currentStep === index + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > index + 1 ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-2 h-0.5 w-8 sm:w-16 ${
                  currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Practice Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Part 1: Basic Practice Information</h2>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Your Current Setup</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What states are you currently operating in and credentialed in? *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select all states where you currently provide services
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {US_STATES.map(state => (
                      <label key={state} className="flex items-center">
                        <input
                          type="checkbox"
                          name="current_operating_states"
                          value={state}
                          className="mr-2"
                          checked={formData.current_operating_states.includes(state)}
                          onChange={handleInputChange}
                        />
                        <span>{state}</span>
                      </label>
                    ))}
                  </div>
                  {formData.current_operating_states.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">Please select at least one state</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are you credentialing yourself as an individual provider, or is this a group practice? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="credentialing_type"
                        value="individual"
                        required
                        className="mr-2"
                        checked={formData.credentialing_type === 'individual'}
                        onChange={handleInputChange}
                      />
                      <span>Individual Provider</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="credentialing_type"
                        value="group"
                        required
                        className="mr-2"
                        checked={formData.credentialing_type === 'group'}
                        onChange={handleInputChange}
                      />
                      <span>Group Practice</span>
                    </label>
                  </div>
                </div>

                {formData.credentialing_type === 'group' && (
                  <div>
                    <label htmlFor="business_entity_type" className="block text-sm font-medium text-gray-700">
                      What's your business entity type? *
                    </label>
                    <select
                      name="business_entity_type"
                      id="business_entity_type"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.business_entity_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select entity type</option>
                      <option value="llc">LLC</option>
                      <option value="s-corp">S-Corporation</option>
                      <option value="c-corp">C-Corporation</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole-proprietor">Sole Proprietorship</option>
                      <option value="non-profit">Non-Profit</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you already have an NPI number? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_npi"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_npi === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_npi"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_npi === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {formData.has_npi === 'yes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NPI Type *
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="npi_type"
                            value="individual"
                            required
                            className="mr-2"
                            checked={formData.npi_type === 'individual'}
                            onChange={handleInputChange}
                          />
                          <span>Individual (Type 1)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="npi_type"
                            value="group"
                            required
                            className="mr-2"
                            checked={formData.npi_type === 'group'}
                            onChange={handleInputChange}
                          />
                          <span>Group (Type 2)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="npi_type"
                            value="both"
                            required
                            className="mr-2"
                            checked={formData.npi_type === 'both'}
                            onChange={handleInputChange}
                          />
                          <span>Both</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="npi_number" className="block text-sm font-medium text-gray-700">
                        NPI Number *
                      </label>
                      <input
                        type="text"
                        name="npi_number"
                        id="npi_number"
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="10-digit NPI"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.npi_number}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's your Tax ID type? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tax_id_type"
                        value="ssn"
                        required
                        className="mr-2"
                        checked={formData.tax_id_type === 'ssn'}
                        onChange={handleInputChange}
                      />
                      <span>SSN (Social Security Number)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tax_id_type"
                        value="ein"
                        required
                        className="mr-2"
                        checked={formData.tax_id_type === 'ein'}
                        onChange={handleInputChange}
                      />
                      <span>EIN (Employer Identification Number)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
                    {formData.tax_id_type === 'ssn' ? 'SSN' : 'EIN'} *
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    id="tax_id"
                    required
                    placeholder={formData.tax_id_type === 'ssn' ? '123-45-6789' : '12-3456789'}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                  />
                </div>

                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mt-8">New State Expansion</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which states are you expanding to? *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select all states where you want to begin offering services
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {US_STATES.map(state => (
                      <label key={state} className="flex items-center">
                        <input
                          type="checkbox"
                          name="target_states"
                          value={state}
                          className="mr-2"
                          checked={formData.target_states.includes(state)}
                          onChange={handleInputChange}
                        />
                        <span>{state}</span>
                      </label>
                    ))}
                  </div>
                  {formData.target_states.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">Please select at least one state</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you already have a business entity registered in the new states? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_business_entity_new_state"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_business_entity_new_state === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes, already registered</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_business_entity_new_state"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_business_entity_new_state === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>No, need to set this up</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have a physical location/address in the new states? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_physical_location"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_physical_location === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes, physical location</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_physical_location"
                        value="remote"
                        required
                        className="mr-2"
                        checked={formData.has_physical_location === 'remote'}
                        onChange={handleInputChange}
                      />
                      <span>No, will operate remotely</span>
                    </label>
                  </div>
                </div>

                {formData.has_physical_location === 'yes' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">New States Address</h4>
                    <div>
                      <label htmlFor="new_state_address_street" className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="new_state_address_street"
                        id="new_state_address_street"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.new_state_address.street}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="new_state_address_city" className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          name="new_state_address_city"
                          id="new_state_address_city"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={formData.new_state_address.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="new_state_address_zip" className="block text-sm font-medium text-gray-700">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          name="new_state_address_zip"
                          id="new_state_address_zip"
                          maxLength={10}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={formData.new_state_address.zip}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Provider Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Part 2: Provider Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How many providers need to be credentialed? *
                  </label>
                  <select
                    name="providers_count"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.providers_count}
                    onChange={handleInputChange}
                  >
                    <option value="1">Just me</option>
                    <option value="2">2 providers</option>
                    <option value="3">3 providers</option>
                    <option value="4">4 providers</option>
                    <option value="5">5+ providers</option>
                  </select>
                </div>

                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Primary Provider Details</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="primary_provider_full_name" className="block text-sm font-medium text-gray-700">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      name="primary_provider_full_name"
                      id="primary_provider_full_name"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.full_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_provider_date_of_birth" className="block text-sm font-medium text-gray-700">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="primary_provider_date_of_birth"
                      id="primary_provider_date_of_birth"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_provider_ssn" className="block text-sm font-medium text-gray-700">
                      SSN (for background checks) *
                    </label>
                    <input
                      type="text"
                      name="primary_provider_ssn"
                      id="primary_provider_ssn"
                      required
                      placeholder="123-45-6789"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.ssn}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_provider_bcba_cert_number" className="block text-sm font-medium text-gray-700">
                      BCBA Certification Number *
                    </label>
                    <input
                      type="text"
                      name="primary_provider_bcba_cert_number"
                      id="primary_provider_bcba_cert_number"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.bcba_cert_number}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_provider_bcba_cert_expiration" className="block text-sm font-medium text-gray-700">
                      BCBA Certification Expiration
                    </label>
                    <input
                      type="date"
                      name="primary_provider_bcba_cert_expiration"
                      id="primary_provider_bcba_cert_expiration"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.bcba_cert_expiration}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_provider_individual_npi" className="block text-sm font-medium text-gray-700">
                      Individual NPI (if available)
                    </label>
                    <input
                      type="text"
                      name="primary_provider_individual_npi"
                      id="primary_provider_individual_npi"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="10-digit NPI"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.individual_npi}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_provider_email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="primary_provider_email"
                      id="primary_provider_email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_provider_phone" className="block text-sm font-medium text-gray-700">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="primary_provider_phone"
                      id="primary_provider_phone"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.primary_provider.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {parseInt(formData.providers_count) > 1 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      Additional provider information will be collected after initial intake.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Target Payers */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Part 3: Target Payers</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you want to be credentialed with Medicaid in {formData.target_states.length > 0 ? formData.target_states.join(', ') : 'the new states'}? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="wants_medicaid"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.wants_medicaid === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes (recommended for ABA)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="wants_medicaid"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.wants_medicaid === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {formData.wants_medicaid === 'yes' && formData.target_states.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Which Medicaid MCOs in {formData.target_states.join(', ')}?
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      We'll help identify the specific MCOs available in your target states
                    </p>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        MCO options will be provided based on your selected states
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which commercial insurers do you want to be in-network with?
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select all that apply
                  </p>
                  <div className="space-y-2">
                    {COMMERCIAL_PAYERS.map(payer => (
                      <label key={payer} className="flex items-center">
                        <input
                          type="checkbox"
                          name="commercial_payers"
                          value={payer}
                          className="mr-2"
                          checked={formData.commercial_payers.includes(payer)}
                          onChange={handleInputChange}
                        />
                        <span>{payer}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="payer_priority" className="block text-sm font-medium text-gray-700">
                    Priority order for payers (optional)
                  </label>
                  <textarea
                    name="payer_priority"
                    id="payer_priority"
                    rows={3}
                    placeholder="E.g., 1. Medicaid, 2. BCBS, 3. Aetna..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.payer_priority}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    We typically recommend starting with Medicaid + your top 2 commercial payers
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Current Documentation Status */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Part 4: What You Currently Have</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have a CAQH ProView profile already? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_caqh"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_caqh === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_caqh"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_caqh === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {formData.has_caqh === 'yes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Is it up to date (attested within last 120 days)? *
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="caqh_updated"
                            value="yes"
                            required
                            className="mr-2"
                            checked={formData.caqh_updated === 'yes'}
                            onChange={handleInputChange}
                          />
                          <span>Yes, up to date</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="caqh_updated"
                            value="no"
                            required
                            className="mr-2"
                            checked={formData.caqh_updated === 'no'}
                            onChange={handleInputChange}
                          />
                          <span>No, needs updating</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="caqh_id" className="block text-sm font-medium text-gray-700">
                        CAQH ID (if known)
                      </label>
                      <input
                        type="text"
                        name="caqh_id"
                        id="caqh_id"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.caqh_id}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have current professional liability insurance? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_prof_liability"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_prof_liability === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_prof_liability"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_prof_liability === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>No (we'll need to obtain this)</span>
                    </label>
                  </div>
                </div>

                {formData.has_prof_liability === 'yes' && (
                  <>
                    <div>
                      <label htmlFor="prof_liability_carrier" className="block text-sm font-medium text-gray-700">
                        Insurance Carrier
                      </label>
                      <input
                        type="text"
                        name="prof_liability_carrier"
                        id="prof_liability_carrier"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.prof_liability_carrier}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="prof_liability_expiration" className="block text-sm font-medium text-gray-700">
                        Policy Expiration Date
                      </label>
                      <input
                        type="date"
                        name="prof_liability_expiration"
                        id="prof_liability_expiration"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.prof_liability_expiration}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have general liability insurance? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_gen_liability"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_gen_liability === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_gen_liability"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_gen_liability === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Document Checklist</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have your BCBA certification documents? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_bcba_cert_docs"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_bcba_cert_docs === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes, readily available</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_bcba_cert_docs"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_bcba_cert_docs === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>Need to obtain</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have your state license(s)? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_state_licenses"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_state_licenses === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes, all current licenses</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_state_licenses"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_state_licenses === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>Need to obtain/renew</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have a current CV/resume? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_current_cv"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_current_cv === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_current_cv"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_current_cv === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>Need to update/create</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have professional references (2-3 people)? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_references"
                        value="yes"
                        required
                        className="mr-2"
                        checked={formData.has_references === 'yes'}
                        onChange={handleInputChange}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_references"
                        value="no"
                        required
                        className="mr-2"
                        checked={formData.has_references === 'no'}
                        onChange={handleInputChange}
                      />
                      <span>Need to identify references</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Practice Information */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Part 5: Practice Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                    Practice/Business Name *
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    id="business_name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.business_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="practice_phone" className="block text-sm font-medium text-gray-700">
                      Practice Phone *
                    </label>
                    <input
                      type="tel"
                      name="practice_phone"
                      id="practice_phone"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.practice_phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="practice_fax" className="block text-sm font-medium text-gray-700">
                      Practice Fax
                    </label>
                    <input
                      type="tel"
                      name="practice_fax"
                      id="practice_fax"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.practice_fax}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="practice_email" className="block text-sm font-medium text-gray-700">
                      Practice Email *
                    </label>
                    <input
                      type="email"
                      name="practice_email"
                      id="practice_email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.practice_email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="office_hours" className="block text-sm font-medium text-gray-700">
                      Office Hours
                    </label>
                    <input
                      type="text"
                      name="office_hours"
                      id="office_hours"
                      placeholder="e.g., Mon-Fri 8am-5pm"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.office_hours}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services You Provide (CPT Codes)
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    We'll review the specific CPT codes for ABA services
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="services_provided"
                        value="assessment"
                        className="mr-2"
                        checked={formData.services_provided.includes('assessment')}
                        onChange={handleInputChange}
                      />
                      <span>Assessment Services</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="services_provided"
                        value="treatment"
                        className="mr-2"
                        checked={formData.services_provided.includes('treatment')}
                        onChange={handleInputChange}
                      />
                      <span>Direct Treatment</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="services_provided"
                        value="supervision"
                        className="mr-2"
                        checked={formData.services_provided.includes('supervision')}
                        onChange={handleInputChange}
                      />
                      <span>Supervision/Training</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="services_provided"
                        value="telehealth"
                        className="mr-2"
                        checked={formData.services_provided.includes('telehealth')}
                        onChange={handleInputChange}
                      />
                      <span>Telehealth Services</span>
                    </label>
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Primary Contact Information</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      name="contact_name"
                      id="contact_name"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.contact_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      id="contact_phone"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      id="contact_email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="preferred_contact_method" className="block text-sm font-medium text-gray-700">
                      Preferred Contact Method
                    </label>
                    <select
                      name="preferred_contact_method"
                      id="preferred_contact_method"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.preferred_contact_method}
                      onChange={handleInputChange}
                    >
                      <option value="">Select preference</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="text">Text Message</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Practice Information</h3>
                  <dl className="text-sm text-gray-600 space-y-1">
                    <div><span className="font-medium">Business Name:</span> {formData.business_name}</div>
                    <div><span className="font-medium">Type:</span> {formData.credentialing_type}</div>
                    <div><span className="font-medium">Current States:</span> {formData.current_operating_states.join(', ')}</div>
                    <div><span className="font-medium">Expanding to:</span> {formData.target_states.join(', ')}</div>
                    <div><span className="font-medium">Tax ID Type:</span> {formData.tax_id_type?.toUpperCase()}</div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Primary Provider</h3>
                  <dl className="text-sm text-gray-600 space-y-1">
                    <div><span className="font-medium">Name:</span> {formData.primary_provider.full_name}</div>
                    <div><span className="font-medium">BCBA #:</span> {formData.primary_provider.bcba_cert_number}</div>
                    <div><span className="font-medium">Email:</span> {formData.primary_provider.email}</div>
                    <div><span className="font-medium">Phone:</span> {formData.primary_provider.phone}</div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Target Payers</h3>
                  <dl className="text-sm text-gray-600 space-y-1">
                    <div><span className="font-medium">Medicaid:</span> {formData.wants_medicaid === 'yes' ? 'Yes' : 'No'}</div>
                    {formData.commercial_payers.length > 0 && (
                      <div><span className="font-medium">Commercial:</span> {formData.commercial_payers.join(', ')}</div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Documentation Status</h3>
                  <dl className="text-sm text-gray-600 space-y-1">
                    <div><span className="font-medium">CAQH Profile:</span> {formData.has_caqh === 'yes' ? 'Yes' : 'No'}</div>
                    <div><span className="font-medium">Prof. Liability Insurance:</span> {formData.has_prof_liability === 'yes' ? 'Yes' : 'No'}</div>
                    <div><span className="font-medium">BCBA Cert Docs:</span> {formData.has_bcba_cert_docs === 'yes' ? 'Available' : 'Need to obtain'}</div>
                    <div><span className="font-medium">State Licenses:</span> {formData.has_state_licenses === 'yes' ? 'Current' : 'Need to obtain'}</div>
                  </dl>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-md">
                  <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
                  <p className="text-sm text-gray-700">
                    After submitting this form:
                  </p>
                  <ol className="mt-2 text-sm text-gray-700 list-decimal list-inside space-y-1">
                    <li>We'll review your information and create your credentialing plan</li>
                    <li>You'll receive a detailed document checklist via email</li>
                    <li>We'll schedule a follow-up call within 24-48 hours</li>
                    <li>Begin collecting and uploading required documents</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </button>
          )}
          
          <div className="ml-auto">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : isEdit ? 'Save Changes' : 'Complete Intake'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}