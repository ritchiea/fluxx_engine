class Array
  def rand
    if RUBY_VERSION < '1.9'
      self.choice
    else
      self.sample
    end
  end
  
  def up_to element
    found = false
    select do |x| 
      unless found
        found = true if x == element
        true
      end
    end
  end

  def down_to element
    found = false
    self.reverse.select do |x| 
      unless found
        found = true if x == element
        true
      end
    end
  end
end