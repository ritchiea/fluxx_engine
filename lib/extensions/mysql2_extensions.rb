module Mysql2
  class Result
    # The mysql gem each_hash is not available in mysql2; make it available
    def each_hash
      self.each(:symbolize_keys => false, :as => :hash) do |row|
        yield row
      end
    end
  end
end
