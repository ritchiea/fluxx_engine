class ModelStub
  
  def self.generate_class klass
    Class.new(BlobStruct) do
      @model_klass = klass
      
      def new_record?
        true
      end

      # This is used by formtastic; can be ignored
      def self.human_name
        'Search'
      end

      # This is used by formtastic; determines the name of the form
      def self.model_name
        ActiveModel::Name.new @model_klass
      end
    end
  end
end
