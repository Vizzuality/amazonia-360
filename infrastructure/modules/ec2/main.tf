resource "aws_instance" "amazonia360-ec2" {
  ami           = var.ami
  instance_type = var.instance_type
  subnet_id     = var.subnet_id
  security_groups = var.security_groups
  key_name = aws_key_pair.local_public_key.key_name
  associate_public_ip_address = true

  user_data = <<-EOF
  #!/bin/bash
  echo "${var.authorized_key}" >> /home/ec2-user/.ssh/authorized_keys
  EOF

  tags = {
    Name = var.instance_name
  }
}


resource "aws_key_pair" "local_public_key" {
  key_name = "amazonia360-key-pair"
  public_key = file("~/.ssh/id_rsa.pub")
}
