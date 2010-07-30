class ModelStub
  
  def self.generate_class klass
    Class.new(klass) do
      def method_missing(method, *args, &block)
        # ignore getter/setter calls
      end
      
      def new_record?
        true
      end

      # This is used by formtastic; can be ignored
      def self.human_name
        'Search'
      end

      # This is used by formtastic; can be ignored
      def self.model_name
        ActiveModel::Name.new super
      end
    end
  end
end
