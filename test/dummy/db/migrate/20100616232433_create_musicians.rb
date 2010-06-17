class CreateMusicians < ActiveRecord::Migration
  def self.up
    create_table :musicians do |t|
      t.timestamps
      t.string :first_name
      t.string :last_name
      t.string :music_type
      t.string :street_address
      t.string :city
      t.string :state
      t.string :zip
      t.date :date_of_birth
    end
  end

  def self.down
    drop_table :musicians
  end
end
