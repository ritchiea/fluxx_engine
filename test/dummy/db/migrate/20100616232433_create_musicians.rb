class CreateMusicians < ActiveRecord::Migration
  def self.up
    create_table :musicians do |t|

      t.timestamps
    end
  end

  def self.down
    drop_table :musicians
  end
end
