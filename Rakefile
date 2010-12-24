# encoding: utf-8

require "rake"

desc "Shows project stats (using cloc)"
task :stats do |t|
  puts `cloc . --exclude-list-file=.clocignore`
end

desc "Deploy code to gh-pages (production)"
task :deploy do
  `git checkout gh-pages && git merge master && git push origin gh-pages && git checkout master`
end
