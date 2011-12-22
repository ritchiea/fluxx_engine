class ActiveRecord::Base
  
  # insta_template do |insta|
  #   insta_entity.add_methods [:main_org, :primary_org]
  #   insta_entity.add_list_method :request_transactions, RequestTransaction
  #   insta_entity.remove_methods [:main_org, :primary_org]
  #   insta_entity.load {|model| model}
  # end
  
  def self.insta_template
    if respond_to?(:template_object) && template_object
      yield template_object if block_given?
    else
      local_template_object = ActiveRecord::ModelDslTemplate.new(self)
      class_inheritable_reader :template_object
      write_inheritable_attribute :template_object, local_template_object
      yield local_template_object if block_given?
    end

    self.liquid_methods *( template_object.all_methods_allowed(self) )
    

    self.instance_eval do
      # TODO ESH: the API for allowed_template_methods needs to be a bit refined:
      #   * combine allowed_template_methods & allowed_template_list_methods
      #   * identify the english name if any 
      #   * identify if the return value is a collection
      #   * identify if the return value is an object and what type it is
      
      # Get a list of all allowed methods that may be exposed to the user
      def allowed_template_methods
        template_object.all_methods_allowed self
      end

      def extra_template_methods
        template_object.extra_methods.map {|meth| meth.to_s}
      end
      
      # Get a list of all allowed list methods that may be exposed to the user
      def allowed_template_list_methods
        template_object.all_list_methods_allowed self
      end
    end
    
    # TODO ESH: the API for evaluate_model_method needs to be a bit refined:
    #    * rather than evaluate_model_list_method, we should call it something that includes list as well as methods that return a complex object
    #    ** either that or have two methods; evaluate_model_list_method and evaluate_model_object_method
    #    *** if we do that then we should have add_methods, add_list_method, add_object_method
    define_method :evaluate_model_method do |method_name|
      local_template_object.evaluate_model_method self, method_name
    end

    define_method :evaluate_model_list_method do |method_name|
      local_template_object.evaluate_model_list_method self, method_name
    end
    
    define_method :process_curly_template do |document, view_context|
      # Use the curly-brace markup to annotate the document
      local_template_object.process_template self, document, view_context
    end

    define_method :process_liquid_template do |document, view_context|
      # Use liquid markup to annotate the document
      local_template_object.process_liquid_template self, document, view_context
    end
    
  end
    
  def self.insta_search
    if respond_to?(:search_object) && search_object
      yield search_object if block_given?
    else
      local_search_object = ActiveRecord::ModelDslSearch.new(self)
      class_inheritable_reader :search_object
      write_inheritable_attribute :search_object, local_search_object
      yield local_search_object if block_given?
    
      self.instance_eval do
        def model_search q_search, request_params={}, results_per_page=25, options={}
          # Pass in actual_model_class option in case the model class is a subclass of the original class
          search_object.model_search q_search, request_params, results_per_page, {:actual_model_class => self}.merge(options)
        end
      
        def safe_find model_id, force_load=false
          # Pass in self in case the model class is a subclass of the original class
          search_object.safe_find model_id, self, force_load
        end
      end
    
      define_method :safe_delete do |fluxx_current_user|
        local_search_object.safe_delete self, fluxx_current_user
      end

      define_method :can_delete? do
        return deletable? if respond_to? :deletable?
        if local_search_object.really_delete && connection.adapter_name =~ /mysql/i && id
          can_delete = true
          ActiveRecord::Base.connection.execute("SELECT table_name, column_name FROM information_schema.KEY_COLUMN_USAGE where TABLE_SCHEMA='#{ActiveRecord::Base.connection.current_database}' AND REFERENCED_TABLE_NAME='#{self.class.table_name}' and REFERENCED_COLUMN_NAME = 'id'").each(:cache_rows => false, :symbolize_keys => true, :as => :hash) do |row|
            p "ESH: 555 row[:table_name].to_s.camelize.singularize=#{row[:table_name].to_s.camelize.singularize}"
            klass = Kernel.const_get row[:table_name].to_s.camelize.singularize rescue nil
            p "ESH: 666 klass=#{klass.inspect}, klass.respond_to?(:deleted_at)=#{klass.column_names.include?(:deleted_at)}" if klass
            if klass && klass.column_names.include?("deleted_at")
              can_delete = false if ActiveRecord::Base.connection.execute("SELECT COUNT(id) FROM #{row[:table_name]} WHERE #{row[:column_name]} = #{id} and deleted_at is null").to_a.first.first > 0
            else
              can_delete = false if ActiveRecord::Base.connection.execute("SELECT COUNT(id) FROM #{row[:table_name]} WHERE #{row[:column_name]} = #{id}").to_a.first.first > 0
            end
            break unless can_delete
          end
          can_delete
        else
          true
        end
      end
    end
  end

  def self.insta_export
    if respond_to?(:export_object) && export_object
      yield export_object if block_given?
    else
      local_export_object = ActiveRecord::ModelDslExport.new(self)
      class_inheritable_reader :export_object
      write_inheritable_attribute :export_object, local_export_object
      yield local_export_object if block_given?
    
      self.instance_eval do
        def csv_sql_query with_clause
          export_object.csv_sql_query with_clause
        end
        def csv_headers with_clause
          export_object.csv_headers with_clause
        end
        def csv_filename with_clause
          export_object.csv_filename with_clause
        end
      end
    end
  end

  def self.insta_realtime
    if respond_to?(:realtime_object) && realtime_object
      yield realtime_object if block_given?
    else
      local_realtime_object = ActiveRecord::ModelDslRealtime.new(self)
      class_inheritable_reader :realtime_disabled
      class_inheritable_reader :realtime_object
      write_inheritable_attribute :realtime_object, local_realtime_object
      yield local_realtime_object if block_given?
    
      after_create {|model| local_realtime_object.realtime_create_callback model unless realtime_disabled }
      after_update {|model| local_realtime_object.realtime_update_callback model unless realtime_disabled }
      after_destroy {|model| local_realtime_object.realtime_destroy_callback model unless realtime_disabled }
    
      self.instance_eval do
        def without_realtime(&block)
          realtime_was_disabled = realtime_disabled
          write_inheritable_attribute :realtime_disabled, true
          block.call.tap { write_inheritable_attribute :realtime_disabled, false unless realtime_was_disabled }
        end
      end
      
      define_method :trigger_realtime_update do
        local_realtime_object.realtime_update_callback self
      end
      
    end
  end
  
  def self.insta_lock options={:class_name => 'User', :foreign_key => 'locked_by_id'}
    if respond_to?(:lock_object) && lock_object
      yield lock_object if block_given?
    else
      local_lock_object = ActiveRecord::ModelDslLock.new(self)
      class_inheritable_reader :lock_object
      write_inheritable_attribute :lock_object, local_lock_object
      yield local_lock_object if block_given?
      belongs_to :locked_by, :class_name => options[:class_name], :foreign_key => options[:foreign_key]
    
      define_method 'editable?'.to_sym do |fluxx_current_user|
        local_lock_object.editable? self, fluxx_current_user
      end
    
      define_method :add_lock do |fluxx_current_user|
        local_lock_object.add_lock self, fluxx_current_user
      end

      define_method :remove_lock do |fluxx_current_user|
        local_lock_object.remove_lock self, fluxx_current_user
      end
    
      define_method :extend_lock do |fluxx_current_user, extend_interval|
        local_lock_object.extend_lock self, fluxx_current_user, extend_interval
      end
    end
  end
  
  def self.find_multi_element_object
    multi_element_object if respond_to?(:multi_element_object)
  end
  
  def self.insta_multi
    if respond_to?(:multi_element_object) && multi_element_object
      yield multi_element_object if block_given?
    else
      local_multi_element_object = ActiveRecord::ModelDslMultiElement.new(self)
      class_inheritable_reader :multi_element_object
      write_inheritable_attribute :multi_element_object, local_multi_element_object
      local_multi_element_object.add_multi_elements
    
      self.instance_eval do
        def add_multi_elements
          multi_element_object.add_multi_elements
        end
        def multi_element_names
          multi_element_object.multi_element_attributes || (superclass.respond_to?(:multi_element_names) ? superclass.multi_element_names : nil)
        end

        def single_multi_element_names
          multi_element_object.single_element_attributes || (superclass.respond_to?(:single_multi_element_names) ? superclass.single_multi_element_names : nil)
        end
      end
    end
  end
  
  def self.insta_utc
    if respond_to?(:utc_object) && utc_object
      yield utc_object if block_given?
    else
      local_utc_object = ActiveRecord::ModelDslUtc.new(self)
      class_inheritable_reader :utc_object
      write_inheritable_attribute :utc_object, local_utc_object
      yield utc_object if block_given?
    end
    utc_object.add_utc_time_attributes
  end
  
  def self.insta_filter_amount
    if respond_to?(:filter_amount_object) && filter_amount_object
      yield filter_amount_object if block_given?
    else
      local_filter_amount_object = ActiveRecord::ModelDslFilterAmount.new(self)
      class_inheritable_reader :filter_amount_object
      write_inheritable_attribute :filter_amount_object, local_filter_amount_object
      yield filter_amount_object if block_given?
    end
    filter_amount_object.add_amount_attributes
  end
  
  PSEUDO_HOST = "ZZSSSSZZZZZS222kkjkjjasflkjasfd"
  def default_url_options
    hostname, protocol = if FluxxManageHost.current_host && FluxxManageHost.current_host =~ /^(.*):\/\/(.*)$/
      [($2 || FluxxManageHost.current_host), ($1 || 'http')]
    end || [PSEUDO_HOST, 'http']
    
    { :host => hostname, :protocol => protocol }
  end
  
  def detail_url
    url_response = url_for(self)
    if url_response
      url_response = url_response.gsub(/http:\/\/#{PSEUDO_HOST}/, '') 
    end
  end
  
  def class_name
    self.class.name
  end
  
  def self.insta_json
    if respond_to?(:model_json_object) && model_json_object
      yield model_json_object if block_given?
    else
      local_model_json_object = ActiveRecord::ModelDslJson.new(self)
      class_inheritable_reader :model_json_object
      write_inheritable_attribute :model_json_object, local_model_json_object
      yield model_json_object if block_given?
    end
  end
  
  def as_json(options={})
    if respond_to?(:model_json_object) && model_json_object
      calc_options = model_json_object.calculate_json_options(options)
      super calc_options
    else
      super options
    end
  end
  
  ############ AASM Extend Methods ###############################
  def self.aasm_event_extend name, options = {}, &block
    events = AASM::StateMachine[self].events
    events.delete name if events[name]
    aasm_event name, options, &block
  end
  
  def self.aasm_state_extend name, options={}
    states = AASM::StateMachine[self].states
    offset = states.index name
    if offset && offset > -1 
      states.delete_at offset
    end
    aasm_state name, options
  end
  
  ############ Utility Helper Methods ###############################
  def self.calculate_form_name
    self.name.tableize.singularize.downcase.to_sym
  end
  
  def filter_amount amount
    ActiveRecord::ModelDslFilterAmount.filter_amount amount
  end

  # Take a paginated collection of IDs and load up the related full objects, maintaining the pagination constants
  def self.page_by_ids model_ids, options={}
    if model_ids.nil? || model_ids.empty?
      model_ids
    else
      query = self.where(:id => model_ids)
      query = query.includes(options[:include_relation]) if options[:include_relation]
      unpaged_models = query.all
      unpaged_models = [unpaged_models] unless unpaged_models.is_a?(Array)
      model_map = unpaged_models.inject({}) {|acc, model| acc[model.id] = model; acc}
      ordered_list = model_ids.map {|model_id| model_map[model_id]}
      result = WillPaginate::Collection.create model_ids.current_page, model_ids.per_page, model_ids.total_entries do |pager|
        pager.replace ordered_list
      end
      
      result
    end
  end

  # Make it possible to update AASM event definitions
  def aasm_event_extend name, options = {}, &block
    events = AASM::StateMachine[self].events
    events.delete name if events[name]
    aasm_event name, options, &block
  end
  
  def self.extract_own_class_names
    extract_classes(self).map(&:name)
  end
  
  def self.extract_class_names_for_model model
    extract_classes(model).map(&:name)
  end
  
  def self.extract_base_class
    model_class = self
    
    klass = model_class
    while model_class 
      model_class = model_class.superclass
      if model_class == ActiveRecord::Base || model_class == Object
        model_class = nil 
      else
        klass = model_class
      end
    end
    klass
  end
  
  
  def self.extract_classes model
    model_class = if model.is_a? Class
      model
    else
      model.class
    end
    
    class_names = []
    while model_class 
      class_names << model_class
      model_class = model_class.superclass
      model_class = nil if model_class == ActiveRecord::Base || model_class == Object
    end
    
    class_names
  end
  
  def primary_uid
    self.id
  end
  
  def self.descendant_base_classes
    base_klasses = self.extract_classes(self)
    all_classes = base_klasses.map{|base_klass| base_klass.descendants}.compact.flatten + base_klasses
    all_classes.uniq
  end
  
  def primary_uid
    if respond_to? :client_id
      "#{self.client_id}_#{self.id}"
    else
      "#{self.id}"
    end
  end
  
  def self.all_controllers
    ActionController::ControllerDsl.all_controllers_for_model self
  end
  
  # Make it so that we do not emit a realtime update or thinking sphinx delta change record based on this update
  def update_attribute_without_log key, value
    if self.class.respond_to?(:sphinx_indexes) && self.class.sphinx_indexes
      self.class.suspended_delta(false) do
        if self.class.respond_to? :without_realtime
          self.class.without_realtime do
            if self.class.respond_to? :without_auditing
              self.class.without_auditing do
                self.update_attribute key, value
              end
            else
              self.update_attribute key, value
            end
          end
        else
          if self.class.respond_to? :without_auditing
            self.class.without_auditing do
              self.update_attribute key, value
            end
          else
            self.update_attribute key, value
          end
        end
      end
    else
      if self.class.respond_to? :without_realtime
        self.class.without_realtime do
          if self.class.respond_to? :without_auditing
            self.class.without_auditing do
              self.update_attribute key, value
            end
          else
            self.update_attribute key, value
          end
        end
      else
        if self.class.respond_to? :without_auditing
          self.class.without_auditing do
            self.update_attribute key, value
          end
        else
          self.update_attribute key, value
        end
      end
    end
  end
  
  # A method that can be overridden to display warning messages to the user.  Pass back an array of warning messages  
  # The form will be hidden but still present.  
  # The user can either go back to editing, or submit as-is and ignore the warnings
  # If you do not override this in the model, warnings will never be displayed and life will go on as usual.
  attr_accessor :ignore_fluxx_warnings
  def fluxx_warnings
    []
  end
  
  def masquerade_as_persisted
    self.instance_variable_set '@persisted', true
    self.instance_variable_set '@new_record', false
    self.instance_variable_set '@destroyed', false
  end
  
  # Force the delta indices to reindex inline
  def self.force_inline_delta_index
    temp_index = ThinkingSphinx::Deltas::DefaultDelta.new '', {}
    begin
      temp_index.send(:update_delta_indexes, self) if temp_index
    rescue Exception => e
      logger.debug "Hit an issue forcing inline delta indices: #{e}, backtrace=#{e.backtrace.inspect}"
    end
  end
  
  # Make it so that we do not emit a realtime update or thinking sphinx delta change record based on this update
  def update_attributes_without_log attr_map
    if self.class.respond_to?(:sphinx_indexes) && self.class.sphinx_indexes
      self.class.suspended_delta(false) do
        if self.class.respond_to? :without_realtime
          self.class.without_realtime do
            if self.class.respond_to? :without_auditing
              self.class.without_auditing do
                self.update_attributes attr_map
              end
            else
              self.update_attributes attr_map
            end
          end
        else
          if self.class.respond_to? :without_auditing
            self.class.without_auditing do
              self.update_attributes attr_map
            end
          else
            self.update_attributes attr_map
          end
        end
      end
    else
      if self.class.respond_to? :without_realtime
        self.class.without_realtime do
          if self.class.respond_to? :without_auditing
            self.class.without_auditing do
              self.update_attributes attr_map
            end
          else
            self.update_attributes attr_map
          end
        end
      else
        if self.class.respond_to? :without_auditing
          self.class.without_auditing do
            self.update_attributes attr_map
          end
        else
          self.update_attributes attr_map
        end
      end
    end
  end
end