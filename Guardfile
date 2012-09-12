guard 'shell' do
  watch(/src\/local.redis[\.|\.lib\.]js/) do |m|
    puts "Rebuilding local.redis.min.js #{Time.now.strftime("%H:%M:%S")}"
    `java -jar lib/compiler.jar --js src/local.redis.js --js_output_file src/local.redis.min.js`
  end
end