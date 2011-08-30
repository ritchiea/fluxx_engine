class CreateSillyAmounts < ActiveRecord::Migration
  def self.up
    create_table :silly_amounts do |t|
      t.integer :silly_id
      t.decimal :amount, :scale => 2, :precision => 15
    end
  end

  def self.down
    drop_table :silly_amounts
  end
end
