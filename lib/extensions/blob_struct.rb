# interface to a Hash using method_missing
# to make a more convenient DSL in some places
class BlobStruct
  def initialize
    @store = Hash.new
  end
  
  def store
    @store
  end
  
  def method_missing(method, *args, &block)
    if method.to_s =~ /=$/
      if args.length == 1
        @store[method.to_s.gsub(/=$/, '')] = args.first 
      elsif block
        @store[method.to_s.gsub(/=$/, '')] = block
      end
    else
      @store[method.to_s]
    end
  end
  
end