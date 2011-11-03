module Mysql2
  class Result
    # The mysql gem each_hash is not available in mysql2; make it available
    def each_hash
      self.each(:symbolize_keys => false, :as => :hash) do |row|
        yield row
      end
    end
    
    def fetch_row
      @results ||= self.to_a
      @offset ||= 0
      
      retval = @results[@offset] if @offset < @results.size
      @offset += 1
      retval
    end
    
    def num_rows
      self.size
    end
    
  end
end
