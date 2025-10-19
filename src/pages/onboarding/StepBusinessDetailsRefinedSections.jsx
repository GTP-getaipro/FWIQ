// Additional sections for StepBusinessDetailsRefined.jsx
// Add these sections after the Online Presence & References section

{/* 4️⃣ Services Catalog */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center text-lg">
      <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
      Services Catalog
    </CardTitle>
    <p className="text-sm text-gray-600">Feeds into AI classification, routing, and auto-reply templates</p>
  </CardHeader>
  <CardContent className="space-y-4">
    {businessType && serviceTemplates[businessType] && (
      <div className="flex justify-end mb-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAddRecommendedServices}
          className="border-blue-300 text-blue-700"
        >
          + Add Recommended Services
        </Button>
      </div>
    )}
    
    <div className="space-y-3">
      {formData.services.map((service, index) => (
        <div key={index} className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={service.enabled}
                onChange={() => handleServiceToggle(index)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label className="font-medium">Service #{index + 1}</Label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveService(index)}
              className="text-red-500 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          
          {service.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Service Name</Label>
                <Input
                  value={service.name}
                  onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                  placeholder="e.g., Pool Cleaning"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Short Description</Label>
                <Textarea
                  value={service.description}
                  onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                  placeholder="Brief description of the service"
                  rows={2}
                />
              </div>
              
              <div>
                <Label>Category</Label>
                <select
                  value={service.category}
                  onChange={(e) => handleServiceChange(index, 'category', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Repair">Repair</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Installation">Installation</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              
              <div>
                <Label>Availability</Label>
                <Input
                  value={service.availability}
                  onChange={(e) => handleServiceChange(index, 'availability', e.target.value)}
                  placeholder="e.g., Mon-Fri 8am-5pm"
                />
              </div>
              
              <div>
                <Label>Pricing Type</Label>
                <select
                  value={service.pricingType}
                  onChange={(e) => handleServiceChange(index, 'pricingType', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Starting At">Starting At</option>
                </select>
              </div>
              
              <div>
                <Label>Duration (optional)</Label>
                <Input
                  value={service.duration}
                  onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                  placeholder="e.g., 1 hour, 2 days"
                />
              </div>
              
              <div>
                <Label>Rate (optional)</Label>
                <Input
                  type="number"
                  value={service.rate}
                  onChange={(e) => handleServiceChange(index, 'rate', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
    
    <Button 
      variant="outline" 
      onClick={() => setFormData(prev => ({
        ...prev,
        services: [...prev.services, {
          name: '',
          description: '',
          category: 'Maintenance',
          availability: '',
          pricingType: 'Fixed',
          duration: '',
          rate: '',
          enabled: true
        }]
      }))}
      className="w-full"
    >
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Custom Service
    </Button>
  </CardContent>
</Card>

{/* 5️⃣ Business Rules */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center text-lg">
      <Sliders className="mr-2 h-5 w-5 text-blue-500" />
      Business Rules
    </CardTitle>
    <p className="text-sm text-gray-600">Defines SLA & escalation logic for AI + automation triggers</p>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="responseSLA" className="flex items-center">
          Response SLA *
          <Info className="ml-1 h-4 w-4 text-gray-400" title="Default response time" />
        </Label>
        <select
          id="responseSLA"
          value={formData.responseSLA}
          onChange={(e) => setFormData(prev => ({ ...prev, responseSLA: e.target.value }))}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="2h">2 Hours</option>
          <option value="4h">4 Hours</option>
          <option value="24h">24 Hours</option>
        </select>
      </div>
      
      <div>
        <Label htmlFor="defaultEscalationManager" className="flex items-center">
          Default Escalation Manager
          <Info className="ml-1 h-4 w-4 text-gray-400" title="Dropdown from defined managers" />
        </Label>
        <select
          id="defaultEscalationManager"
          value={formData.defaultEscalationManager}
          onChange={(e) => setFormData(prev => ({ ...prev, defaultEscalationManager: e.target.value }))}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {managers.map(manager => (
            <option key={manager.email} value={manager.name}>{manager.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <Label htmlFor="crmProvider" className="flex items-center">
          CRM Provider
          <Info className="ml-1 h-4 w-4 text-gray-400" title="ServiceTitan, Jobber, HubSpot, etc." />
        </Label>
        <select
          id="crmProvider"
          value={formData.crmProvider}
          onChange={(e) => setFormData(prev => ({ ...prev, crmProvider: e.target.value }))}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {crmProviders.map(provider => (
            <option key={provider} value={provider}>{provider}</option>
          ))}
        </select>
      </div>
      
      <div>
        <Label htmlFor="crmAlertEmails" className="flex items-center">
          CRM Alert Emails
          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used to map system alerts into Manager/Unassigned label" />
        </Label>
        <Input
          id="crmAlertEmails"
          value={formData.crmAlertEmails}
          onChange={(e) => setFormData(prev => ({ ...prev, crmAlertEmails: e.target.value }))}
          placeholder="alerts@servicetitan.com, noreply@reports.connecteam.com"
        />
      </div>
    </div>
    
    <div>
      <Label htmlFor="escalationPolicy" className="flex items-center">
        Escalation Policy
        <Info className="ml-1 h-4 w-4 text-gray-400" title="If no manager replies in X hours → escalate to [Manager]" />
      </Label>
      <Textarea
        id="escalationPolicy"
        value={formData.escalationPolicy}
        onChange={(e) => setFormData(prev => ({ ...prev, escalationPolicy: e.target.value }))}
        placeholder="e.g., If no manager responds in 4 hours, escalate to owner."
        rows={3}
      />
    </div>
    
    <div>
      <Label className="flex items-center mb-2">
        Business Hours + Holiday Exceptions
        <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for after-hours logic" />
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Mon-Fri</Label>
          <Input
            value={formData.businessHours.mon_fri}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              businessHours: { ...prev.businessHours, mon_fri: e.target.value }
            }))}
          />
        </div>
        <div>
          <Label className="text-xs">Saturday</Label>
          <Input
            value={formData.businessHours.sat}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              businessHours: { ...prev.businessHours, sat: e.target.value }
            }))}
          />
        </div>
        <div>
          <Label className="text-xs">Sunday</Label>
          <Input
            value={formData.businessHours.sun}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              businessHours: { ...prev.businessHours, sun: e.target.value }
            }))}
          />
        </div>
      </div>
    </div>
  </CardContent>
</Card>

{/* 6️⃣ AI Preferences & Signature */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center text-lg">
      <Shield className="mr-2 h-5 w-5 text-blue-500" />
      AI Preferences & Signature
    </CardTitle>
    <p className="text-sm text-gray-600">Final AI configuration layer</p>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="allowPricing"
        checked={formData.allowPricing}
        onChange={(e) => setFormData(prev => ({ ...prev, allowPricing: e.target.checked }))}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <Label htmlFor="allowPricing" className="flex items-center">
        Allow AI to mention pricing in replies
        <Info className="ml-1 h-4 w-4 text-gray-400" title="Controls pricing visibility logic" />
      </Label>
    </div>
    
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="includeSignature"
        checked={formData.includeSignature}
        onChange={(e) => setFormData(prev => ({ ...prev, includeSignature: e.target.checked }))}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <Label htmlFor="includeSignature" className="flex items-center">
        Include business signature in every email
        <Info className="ml-1 h-4 w-4 text-gray-400" title="Branding and compliance" />
      </Label>
    </div>
    
    <div>
      <Label htmlFor="toneOfVoice" className="flex items-center">
        Tone of Voice
        <Info className="ml-1 h-4 w-4 text-gray-400" title="Affects LLM prompt" />
      </Label>
      <select
        id="toneOfVoice"
        value={formData.toneOfVoice}
        onChange={(e) => setFormData(prev => ({ ...prev, toneOfVoice: e.target.value }))}
        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {toneOptions.map(tone => (
          <option key={tone.value} value={tone.value}>{tone.value}</option>
        ))}
      </select>
      <p className="text-sm text-gray-600 mt-1">
        {toneOptions.find(t => t.value === formData.toneOfVoice)?.description}
      </p>
    </div>
    
    <div>
      <Label htmlFor="signatureTemplate" className="flex items-center">
        Signature Preview
        <Info className="ml-1 h-4 w-4 text-gray-400" title="Template with dynamic variables" />
      </Label>
      <Textarea
        id="signatureTemplate"
        value={formData.signatureTemplate}
        onChange={(e) => setFormData(prev => ({ ...prev, signatureTemplate: e.target.value }))}
        placeholder={`Best regards,\n{{businessName}}\n{{primaryContactName}}\n{{primaryEmail}}\n{{afterHoursLine}}`}
        rows={6}
      />
      <p className="text-xs text-gray-500 mt-1">
        Available variables: {`{{businessName}}, {{primaryContactName}}, {{primaryEmail}}, {{afterHoursLine}}`}
      </p>
    </div>
  </CardContent>
</Card>
