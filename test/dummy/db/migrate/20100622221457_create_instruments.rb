class CreateInstruments < ActiveRecord::Migration
  def self.up
    create_table :instruments do |t|
      t.timestamps
      t.string :name
      t.date :date_of_birth
      t.date :deleted_at
      t.integer :created_by_id
      t.integer :modified_by_id
      t.date :locked_until
      t.integer :locked_by_id
    end
  end

  def self.down
    drop_table :instruments
  end
end
